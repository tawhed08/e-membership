import { Response } from "express";

import Membership from "../models/Membership";
import MembershipPlan from "../models/MembershipPlan";
import User from "../models/User";
import mongoose from "mongoose";
import { escapeRegExp } from "../utils/escapeRegExp";
import Certificate from "../models/Certificate";
import { AuthRequest } from "../middleware/authMiddleware";

export async function createMembership(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;
    const planId: unknown = req.body?.planId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (typeof planId !== "string" || !planId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Membership plan is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });
    }

    const plan = await MembershipPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or inactive",
      });
    }

    const existingMembership =
      await Membership.findOne({
        user: userId,
        status: {
          $in: ["pending", "active"],
        },
      });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active or pending membership",
        membership: existingMembership,
      });
    }

    const membership = await Membership.create({
      user: userId,
      plan: plan._id,
      status: "pending",
      paymentStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Membership created successfully",
      membership,
    });
  } catch (error) {
    console.error(
      "Create membership error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating membership",
    });
  }
}

export async function createAdminMembership(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId: unknown = req.body?.userId;
    const planId: unknown = req.body?.planId;
    const status: unknown = req.body?.status;
    const paymentStatus: unknown = req.body?.paymentStatus;
    const startDateInput: unknown = req.body?.startDate;

    if (
      typeof userId !== "string" ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid user is required",
      });
    }

    if (
      typeof planId !== "string" ||
      !mongoose.Types.ObjectId.isValid(planId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid membership plan is required",
      });
    }

    if (
      status !== "active" &&
      status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or pending",
      });
    }

    if (
      paymentStatus !== "paid" &&
      paymentStatus !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment status must be paid or pending",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plan = await MembershipPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or inactive",
      });
    }

    const existingMembership =
      await Membership.findOne({
        user: userId,
        status: {
          $in: ["pending", "active"],
        },
      });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message:
          "This user already has an active or pending membership",
        membership: existingMembership,
      });
    }

    let startDate = new Date();

    if (
      typeof startDateInput === "string" &&
      startDateInput.trim()
    ) {
      const parsedStartDate = new Date(startDateInput);

      if (Number.isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      startDate = parsedStartDate;
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(
      expiryDate.getDate() + plan.durationDays
    );

    const membership = await Membership.create({
      user: userId,
      plan: plan._id,
      startDate,
      expiryDate,
      status,
      paymentStatus,
    });

    const populatedMembership =
      await Membership.findById(membership._id)
        .populate("user", "name email phone")
        .populate(
          "plan",
          "name description price durationDays"
        );

    return res.status(201).json({
      success: true,
      message: "Membership added successfully",
      membership: populatedMembership,
    });
  } catch (error) {
    console.error(
      "Create admin membership error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding membership",
    });
  }
}

export async function getMyMembership(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const membership =
      await Membership.findOne({
        user: userId,
      })
        .populate(
          "plan",
          "name description price durationDays"
        )
        .sort({
          createdAt: -1,
        });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "No membership found",
      });
    }

    return res.status(200).json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error(
      "Get my membership error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting membership",
    });
  }
}

export async function getMyMembershipHistory(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const memberships = await Membership.find({
      user: userId,
    })
      .populate("plan", "name description price durationDays")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      memberships,
    });
  } catch (error) {
    console.error("Get membership history error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting membership history",
    });
  }
}

export async function getAllMemberships(
  req: AuthRequest,
  res: Response
) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const status =
      typeof req.query.status === "string" &&
      ["pending", "active", "expired", "cancelled"].includes(
        req.query.status
      )
        ? req.query.status
        : undefined;

    const paymentStatus =
      req.query.paymentStatus === "paid" ||
      req.query.paymentStatus === "pending" ||
      req.query.paymentStatus === "failed" ||
      req.query.paymentStatus === "refunded"
        ? req.query.paymentStatus
        : undefined;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search) {
      const escapedSearch = escapeRegExp(search);

      const matchingUsers = await User.find({
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
        ],
      }).distinct("_id");

      const matchingId =
        mongoose.Types.ObjectId.isValid(search)
          ? [new mongoose.Types.ObjectId(search)]
          : [];

      filter.$or = [
        { user: { $in: matchingUsers } },
        { _id: { $in: matchingId } },
      ];
    }

    const [memberships, total] = await Promise.all([
      Membership.find(filter)
        .populate("user", "name email phone")
        .populate(
          "plan",
          "name description price durationDays"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Membership.countDocuments(filter),
    ]);

    const issuedMembershipIds = new Set(
      (
        await Certificate.distinct("membership", {
          membership: {
            $in: memberships.map(
              (membership) => membership._id
            ),
          },
        })
      ).map((id) => id.toString())
    );

    return res.status(200).json({
      success: true,
      memberships: memberships.map((membership) => ({
        ...membership.toObject(),
        certificateIssued: issuedMembershipIds.has(
          membership._id.toString()
        ),
      })),

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "Get all memberships error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting memberships",
    });
  }
}