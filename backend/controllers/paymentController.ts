import { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";

import Payment from "../models/Payment";
import Membership from "../models/Membership";
import MembershipPlan from "../models/MembershipPlan";
import User from "../models/User";
import PaymentSettings, {
  BankPaymentSettings,
  IPaymentSettings,
  ManualPaymentMethodSettings,
} from "../models/PaymentSettings";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  sendMembershipActivatedEmail,
  sendPaymentUpdateEmail,
  sendTransactionalEmail,
} from "../services/emailService";
import { createCertificateForMembership } from "../services/certificateService";
import { escapeRegExp } from "../utils/escapeRegExp";
import {
  initiateAamarPayCheckout,
  isAamarPayConfigured,
  verifyAamarPayTransaction,
} from "../services/paymentService";

const PAYMENT_SETTINGS_ID = "payment-methods";

function defaultPaymentSettings(): IPaymentSettings {
  return {
    _id: PAYMENT_SETTINGS_ID,
    bkash: {
      enabled: true,
      accountName: "",
      accountNumber: "",
      instructions:
        "Contact the membership team for payment instructions.",
    },
    nagad: {
      enabled: true,
      accountName: "",
      accountNumber: "",
      instructions:
        "Contact the membership team for payment instructions.",
    },
    bank: {
      enabled: true,
      accountName: "",
      accountNumber: "",
      bankName: "",
      branch: "",
      instructions:
        "Contact the membership team for payment instructions.",
    },
    cardEnabled: true,
  };
}

function frontendPaymentReturnUrl(result: string): string {
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (!frontendUrl) {
    throw new Error(
      "FRONTEND_URL is required for payment callbacks."
    );
  }

  const target = new URL(
    "/membership/payment",
    frontendUrl
  );

  target.searchParams.set("gateway", result);

  return target.toString();
}

function getCallbackValue(
  body: unknown,
  keys: string[]
): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const values = body as Record<string, unknown>;

  for (const key of keys) {
    const value = values[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return undefined;
}

function isManualPaymentMethod(
  value: unknown
): value is "bkash" | "nagad" | "bank" {
  return (
    value === "bkash" ||
    value === "nagad" ||
    value === "bank"
  );
}

async function claimMembershipForPayment(
  membershipId: mongoose.Types.ObjectId,
  userId: string,
  paymentId: mongoose.Types.ObjectId
): Promise<boolean> {
  const membership =
    await Membership.findOneAndUpdate(
      {
        _id: membershipId,
        user: userId,
        status: "pending",
        paymentStatus: "pending",
        pendingPaymentId: {
          $exists: false,
        },
      },
      {
        $set: {
          pendingPaymentId: paymentId,
        },
      },
      {
        new: true,
      }
    );

  return Boolean(membership);
}

async function releaseMembershipPaymentClaim(
  membershipId: mongoose.Types.ObjectId,
  paymentId: mongoose.Types.ObjectId
): Promise<void> {
  await Membership.updateOne(
    {
      _id: membershipId,
      pendingPaymentId: paymentId,
    },
    {
      $unset: {
        pendingPaymentId: 1,
      },
    }
  );
}

async function activatePendingPayment(
  paymentId: mongoose.Types.ObjectId,
  expectedMethod?: "card" | "bkash" | "nagad" | "bank"
): Promise<{
  payment: mongoose.Document & {
    user: mongoose.Types.ObjectId;
    transactionId: string;
  };
  membership: mongoose.Document & {
    expiryDate?: Date;
  };
}> {
  const session = await mongoose.startSession();

  let activated:
    | {
        payment: mongoose.Document & {
          user: mongoose.Types.ObjectId;
          transactionId: string;
        };
        membership: mongoose.Document & {
          expiryDate?: Date;
        };
      }
    | undefined;

  try {
    await session.withTransaction(async () => {
      const filter: Record<string, unknown> = {
        _id: paymentId,
        status: "pending",
      };

      if (expectedMethod) {
        filter.method = expectedMethod;
      }

      const payment =
        await Payment.findOneAndUpdate(
          filter,
          {
            $set: {
              status: "approved",
              paidAt: new Date(),
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!payment) {
        throw new Error(
          "Payment is no longer pending."
        );
      }

      const membership =
        await Membership.findOne({
          _id: payment.membership,
          status: "pending",
          paymentStatus: "pending",
          $or: [
            {
              pendingPaymentId: payment._id,
            },
            {
              pendingPaymentId: {
                $exists: false,
              },
            },
          ],
        }).session(session);

      if (!membership) {
        throw new Error(
          "The membership is no longer awaiting payment."
        );
      }

      const plan =
        await MembershipPlan.findById(
          membership.plan
        ).session(session);

      if (!plan) {
        throw new Error(
          "Membership plan not found."
        );
      }

      const startDate = new Date();

      const expiryDate = new Date(
        startDate.getTime() +
          plan.durationDays *
            24 *
            60 *
            60 *
            1000
      );

      membership.paymentStatus = "paid";
      membership.status = "active";
      membership.startDate = startDate;
      membership.expiryDate = expiryDate;
      membership.pendingPaymentId = undefined;

      await membership.save({
        session,
      });

      await User.updateOne(
        {
          _id: payment.user,
          role: "user",
          suspendedByAdmin: {
            $ne: true,
          },
        },
        {
          $set: {
            isActive: true,
            suspendedByAdmin: false,
          },
        },
        {
          session,
        }
      );

      /*
       * Automatically create a certificate after
       * successful payment and membership activation.
       *
       * This happens inside the same MongoDB transaction,
       * so payment + membership + certificate stay consistent.
       */
      await createCertificateForMembership(
        membership._id,
        {
          session,
        }
      );

      activated = {
        payment,
        membership,
      };
    });
  } finally {
    await session.endSession();
  }

  if (!activated) {
    throw new Error(
      "Payment activation did not complete."
    );
  }

  const paymentUser =
    await User.findById(
      activated.payment.user
    ).select("email name");

  if (paymentUser) {
    try {
      await Promise.all([
        sendPaymentUpdateEmail(
          paymentUser.email,
          paymentUser.name,
          activated.payment.transactionId,
          true
        ),

        sendMembershipActivatedEmail(
          paymentUser.email,
          paymentUser.name,
          activated.membership
            .expiryDate as Date
        ),
      ]);
    } catch (emailError) {
      console.error(
        "Payment approval email failed:",
        emailError
      );
    }
  }

  return activated;
}

function isManualSettings(
  value: unknown,
  includeBank: boolean
): value is
  | ManualPaymentMethodSettings
  | BankPaymentSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings =
    value as Record<string, unknown>;

  const commonValid =
    typeof settings.enabled === "boolean" &&
    typeof settings.accountName === "string" &&
    typeof settings.accountNumber === "string" &&
    typeof settings.instructions === "string" &&
    settings.accountName.length <= 120 &&
    settings.accountNumber.length <= 120 &&
    settings.instructions.length <= 1000;

  return (
    commonValid &&
    (!includeBank ||
      (typeof settings.bankName === "string" &&
        settings.bankName.length <= 120 &&
        typeof settings.branch === "string" &&
        settings.branch.length <= 120))
  );
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    }
  );
}

export async function getPaymentSettings(
  _req: Request,
  res: Response
) {
  try {
    const stored =
      await PaymentSettings.findById(
        PAYMENT_SETTINGS_ID
      ).lean();

    const settings =
      stored ?? defaultPaymentSettings();

    return res.status(200).json({
      success: true,
      settings: {
        bkash: settings.bkash,
        nagad: settings.nagad,
        bank: settings.bank,
        card: {
          enabled:
            settings.cardEnabled &&
            isAamarPayConfigured(),
          provider: "aamarPay",
          gatewayConfigured:
            isAamarPayConfigured(),
        },
      },
    });
  } catch (error) {
    console.error(
      "Get payment settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load payment instructions.",
    });
  }
}

export async function updatePaymentSettings(
  req: AuthRequest,
  res: Response
) {
  const input = req.body ?? {};

  if (
    typeof input.cardEnabled !== "boolean" ||
    !isManualSettings(
      input.bkash,
      false
    ) ||
    !isManualSettings(
      input.nagad,
      false
    ) ||
    !isManualSettings(
      input.bank,
      true
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Provide valid payment settings for each payment method.",
    });
  }

  try {
    const settings =
      await PaymentSettings.findByIdAndUpdate(
        PAYMENT_SETTINGS_ID,
        {
          $set: {
            bkash: input.bkash,
            nagad: input.nagad,
            bank: input.bank,
            cardEnabled: input.cardEnabled,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Payment settings saved.",
      settings: {
        bkash: settings.bkash,
        nagad: settings.nagad,
        bank: settings.bank,
        card: {
          enabled:
            settings.cardEnabled &&
            isAamarPayConfigured(),
          provider: "aamarPay",
          gatewayConfigured:
            isAamarPayConfigured(),
        },
      },
    });
  } catch (error) {
    console.error(
      "Update payment settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save payment settings.",
    });
  }
}

export async function createPayment(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;

    const {
      membershipId,
      transactionId,
      note,
    } = req.body ?? {};

    const method: unknown =
      req.body?.method;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (!membershipId) {
      return res.status(400).json({
        success: false,
        message: "Membership is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        String(membershipId)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership ID",
      });
    }

    if (!isManualPaymentMethod(method)) {
      return res.status(400).json({
        success: false,
        message:
          "Payment method must be bKash, Nagad or bank transfer.",
      });
    }

    if (
      typeof transactionId !== "string" ||
      !transactionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID is required",
      });
    }

    if (transactionId.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID must be 100 characters or fewer",
      });
    }

    if (
      note !== undefined &&
      (typeof note !== "string" ||
        note.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment note must be 500 characters or fewer",
      });
    }

    const paymentSettings =
      (await PaymentSettings.findById(
        PAYMENT_SETTINGS_ID
      ).lean()) ??
      defaultPaymentSettings();

    if (!paymentSettings[method].enabled) {
      return res.status(400).json({
        success: false,
        message:
          "This payment method is currently unavailable.",
      });
    }

    const membership =
      await Membership.findOne({
        _id: membershipId,
        user: userId,
      });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Membership not found",
      });
    }

    if (membership.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Payment can only be submitted for a pending membership",
      });
    }

    if (
      membership.paymentStatus !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment has already been processed",
      });
    }

    const plan =
      await MembershipPlan.findById(
        membership.plan
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan not found",
      });
    }

    const existingPayment =
      await Payment.findOne({
        membership: membership._id,
        status: "pending",
      });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message:
          "A pending payment already exists for this membership",
        payment: existingPayment,
      });
    }

    const cleanTransactionId =
      transactionId.trim();

    const duplicateTransaction =
      await Payment.findOne({
        transactionId: cleanTransactionId,
      });

    if (duplicateTransaction) {
      return res.status(409).json({
        success: false,
        message:
          "This transaction ID has already been used",
      });
    }

    const payment =
      await Payment.create({
        user: userId,
        membership: membership._id,
        amount: plan.price,
        method,
        transactionId:
          cleanTransactionId,
        status: "pending",
        note: note
          ? String(note).trim()
          : undefined,
      });

    const claimed =
      await claimMembershipForPayment(
        membership._id,
        userId,
        payment._id
      );

    if (!claimed) {
      await Payment.updateOne(
        {
          _id: payment._id,
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
          },
        }
      );

      return res.status(409).json({
        success: false,
        message:
          "Another payment is already being processed for this membership.",
      });
    }

    const paymentUser =
      await User.findById(userId).select(
        "email name"
      );

    if (paymentUser) {
      try {
        await sendTransactionalEmail({
          email: paymentUser.email,
          subject:
            "Payment received for review",
          text: `Hello ${paymentUser.name}, your payment submission ${payment.transactionId} has been received and is awaiting review.`,
          html: `<p>Hello ${escapeHtml(
            paymentUser.name
          )},</p><p>Your payment submission <strong>${escapeHtml(
            payment.transactionId
          )}</strong> has been received and is awaiting review.</p>`,
        });
      } catch (emailError) {
        console.error(
          "Payment submission email failed:",
          emailError
        );
      }
    }

    return res.status(201).json({
      success: true,
      message:
        "Payment submitted successfully. Waiting for admin approval.",
      payment,
    });
  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating payment",
    });
  }
}

export async function startCardCheckout(
  req: AuthRequest,
  res: Response
) {
  const userId = req.user?.userId;
  const membershipId =
    req.body?.membershipId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required",
    });
  }

  if (
    typeof membershipId !== "string" ||
    !mongoose.Types.ObjectId.isValid(
      membershipId
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid membership ID is required.",
    });
  }

  try {
    const settings =
      (await PaymentSettings.findById(
        PAYMENT_SETTINGS_ID
      ).lean()) ??
      defaultPaymentSettings();

    if (
      !settings.cardEnabled ||
      !isAamarPayConfigured()
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Card checkout is not currently available.",
      });
    }

    const membership =
      await Membership.findOne({
        _id: membershipId,
        user: userId,
        status: "pending",
        paymentStatus: "pending",
      });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Pending membership not found.",
      });
    }

    const existingPendingCardPayment =
      await Payment.findOne({
        membership: membership._id,
        status: "pending",
      });

    if (existingPendingCardPayment) {
      return res.status(409).json({
        success: false,
        message:
          "A payment is already awaiting confirmation for this membership.",
      });
    }

    const [plan, customer] =
      await Promise.all([
        MembershipPlan.findById(
          membership.plan
        ),
        User.findById(userId).select(
          "name email phone"
        ),
      ]);

    if (!plan || !customer) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan or customer profile not found.",
      });
    }

    if (!customer.phone?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Add a phone number to your profile before paying by card.",
      });
    }

    const transactionId = `EM${randomBytes(
      15
    )
      .toString("hex")
      .toUpperCase()}`;

    const payment =
      await Payment.create({
        user: userId,
        membership: membership._id,
        amount: plan.price,
        method: "card",
        transactionId,
        status: "pending",
      });

    const claimed =
      await claimMembershipForPayment(
        membership._id,
        userId,
        payment._id
      );

    if (!claimed) {
      await Payment.updateOne(
        {
          _id: payment._id,
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
          },
        }
      );

      return res.status(409).json({
        success: false,
        message:
          "Another payment is already being processed for this membership.",
      });
    }

    try {
      const checkoutUrl =
        await initiateAamarPayCheckout({
          transactionId,
          amount: payment.amount,
          description: `E-Membership ${plan.name}`,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
        });

      return res.status(201).json({
        success: true,
        message:
          "Secure card checkout created.",
        transactionId,
        checkoutUrl,
      });
    } catch (gatewayError) {
      await Payment.updateOne(
        {
          _id: payment._id,
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
          },
        }
      );

      await releaseMembershipPaymentClaim(
        membership._id,
        payment._id
      );

      console.error(
        "aamarPay checkout initiation failed:",
        gatewayError
      );

      return res.status(502).json({
        success: false,
        message:
          "Unable to start card checkout. Please try again.",
      });
    }
  } catch (error) {
    console.error(
      "Card checkout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to start card checkout.",
    });
  }
}

function isVerifiedSuccessfulTransaction(
  data: Awaited<
    ReturnType<typeof verifyAamarPayTransaction>
  >,
  payment: {
    transactionId: string;
    amount: number;
  }
): boolean {
  const transactionId =
    data.mer_txnid ?? data.tran_id;

  const paidAmount = Number(
    data.amount_bdt ??
      data.amount_original ??
      data.amount
  );

  const currency = String(
    data.currency_merchant ??
      data.currency ??
      ""
  ).toUpperCase();

  return (
    String(data.status_code) === "2" &&
    data.pay_status?.toLowerCase() ===
      "successful" &&
    transactionId ===
      payment.transactionId &&
    data.store_id ===
      process.env.AAMARPAY_STORE_ID?.trim() &&
    currency === "BDT" &&
    Number.isFinite(paidAmount) &&
    Math.round(paidAmount * 100) ===
      Math.round(payment.amount * 100)
  );
}

export async function handleAamarPaySuccess(
  req: Request,
  res: Response
) {
  const transactionId =
    getCallbackValue(req.body, [
      "mer_txnid",
      "tran_id",
    ]);

  if (!transactionId) {
    return res.redirect(
      303,
      frontendPaymentReturnUrl("failed")
    );
  }

  try {
    const payment =
      await Payment.findOne({
        transactionId,
        method: "card",
      });

    if (!payment) {
      return res.redirect(
        303,
        frontendPaymentReturnUrl("failed")
      );
    }

    if (payment.status === "approved") {
      return res.redirect(
        303,
        frontendPaymentReturnUrl("success")
      );
    }

    if (payment.status !== "pending") {
      return res.redirect(
        303,
        frontendPaymentReturnUrl("failed")
      );
    }

    const verification =
      await verifyAamarPayTransaction(
        transactionId
      );

    if (
      !isVerifiedSuccessfulTransaction(
        verification,
        payment
      )
    ) {
      console.warn(
        `[aamarPay] Transaction verification did not match payment ${payment._id}.`
      );

      return res.redirect(
        303,
        frontendPaymentReturnUrl("failed")
      );
    }

    await activatePendingPayment(
      new mongoose.Types.ObjectId(
        payment._id.toString()
      ),
      "card"
    );

    return res.redirect(
      303,
      frontendPaymentReturnUrl("success")
    );
  } catch (error) {
    console.error(
      "aamarPay success callback verification failed:",
      error
    );

    return res.redirect(
      303,
      frontendPaymentReturnUrl(
        "verification-error"
      )
    );
  }
}

export async function handleAamarPayFailure(
  req: Request,
  res: Response
) {
  const transactionId =
    getCallbackValue(req.body, [
      "mer_txnid",
      "tran_id",
    ]);

  if (transactionId) {
    try {
      const payment =
        await Payment.findOne({
          transactionId,
          method: "card",
          status: "pending",
        });

      if (payment) {
        const verification =
          await verifyAamarPayTransaction(
            transactionId
          );

        const callbackTransactionId =
          verification.mer_txnid ??
          verification.tran_id;

        if (
          callbackTransactionId ===
            transactionId &&
          verification.store_id ===
            process.env.AAMARPAY_STORE_ID?.trim() &&
          ["3", "7"].includes(
            String(verification.status_code)
          )
        ) {
          const update =
            await Payment.updateOne(
              {
                _id: payment._id,
                status: "pending",
              },
              {
                $set: {
                  status: "rejected",
                },
              }
            );

          if (update.modifiedCount > 0) {
            await releaseMembershipPaymentClaim(
              payment.membership,
              payment._id
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "aamarPay failed-payment verification failed:",
        error
      );
    }
  }

  return res.redirect(
    303,
    frontendPaymentReturnUrl("failed")
  );
}

export async function getMyPayments(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const payments =
      await Payment.find({
        user: userId,
      })
        .populate(
          "membership",
          "status paymentStatus startDate expiryDate"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error(
      "Get my payments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting payments",
    });
  }
}

export async function getAllPayments(
  req: AuthRequest,
  res: Response
) {
  try {
    const page = Math.max(
      1,
      Number(req.query.page) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.query.limit) || 20
      )
    );

    const status =
      typeof req.query.status ===
        "string" &&
      [
        "pending",
        "approved",
        "rejected",
        "refunded",
      ].includes(req.query.status)
        ? req.query.status
        : undefined;

    const search =
      typeof req.query.search ===
      "string"
        ? req.query.search.trim()
        : "";

    const filter: Record<
      string,
      unknown
    > = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const escapedSearch =
        escapeRegExp(search);

      const matchingUsers =
        await User.find({
          $or: [
            {
              name: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
            {
              email: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
            {
              phone: {
                $regex: escapedSearch,
                $options: "i",
              },
            },
          ],
        }).distinct("_id");

      filter.$or = [
        {
          transactionId: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          method: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          user: {
            $in: matchingUsers,
          },
        },
      ];
    }

    const [payments, total] =
      await Promise.all([
        Payment.find(filter)
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "membership",
            "status paymentStatus startDate expiryDate"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) * limit
          )
          .limit(limit),

        Payment.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(
          total / limit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get all payments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting payments",
    });
  }
}

export async function approvePayment(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = String(
      req.params.id
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment ID",
      });
    }

    const payment =
      await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending payments can be approved",
      });
    }

    if (payment.method === "card") {
      return res.status(400).json({
        success: false,
        message:
          "Card payments can only be approved after gateway verification.",
      });
    }

    const activated =
      await activatePendingPayment(
        new mongoose.Types.ObjectId(id),
        payment.method
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment approved and membership activated successfully",
      payment: activated.payment,
      membership:
        activated.membership,
    });
  } catch (error) {
    console.error(
      "Approve payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while approving payment",
    });
  }
}

export async function rejectPayment(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = String(
      req.params.id
    );

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment ID",
      });
    }

    const payment =
      await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending payments can be rejected",
      });
    }

    if (payment.method === "card") {
      return res.status(400).json({
        success: false,
        message:
          "Card payment status is controlled by aamarPay verification.",
      });
    }

    payment.status = "rejected";

    await payment.save();

    /*
     * Release the membership payment claim so the user
     * can submit another payment for the same pending
     * membership after a rejection.
     */
    await releaseMembershipPaymentClaim(
      payment.membership,
      payment._id
    );

    const paymentUser =
      await User.findById(
        payment.user
      ).select("email name");

    if (paymentUser) {
      try {
        await sendPaymentUpdateEmail(
          paymentUser.email,
          paymentUser.name,
          payment.transactionId,
          false
        );
      } catch (emailError) {
        console.error(
          "Payment rejection email failed:",
          emailError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Payment rejected successfully",
      payment,
    });
  } catch (error) {
    console.error(
      "Reject payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while rejecting payment",
    });
  }
}