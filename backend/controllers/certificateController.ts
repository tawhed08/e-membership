import { Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import Certificate from "../models/Certificate";
import Membership from "../models/Membership";
import MembershipPlan from "../models/MembershipPlan";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendCertificateIssuedEmail } from "../services/emailService";
import { escapeRegExp } from "../utils/escapeRegExp";

function generateCertificateId(): string {
  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `EM-${Date.now()
    .toString(36)
    .toUpperCase()}-${randomPart}`;
}

export async function issueCertificate(
  req: AuthRequest,
  res: Response
) {
  try {
    const { membershipId } = req.body;

    if (!membershipId) {
      return res.status(400).json({
        success: false,
        message: "Membership ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(membershipId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership ID",
      });
    }

    const membership =
      await Membership.findById(membershipId);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    if (membership.status !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "Certificate can only be issued for an active membership",
      });
    }

    if (membership.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message:
          "Certificate can only be issued after payment approval",
      });
    }

    if (
      !membership.startDate ||
      !membership.expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Membership start and expiry dates are required",
      });
    }

    const existingCertificate =
      await Certificate.findOne({
        membership: membership._id,
      });

    if (existingCertificate) {
      return res.status(409).json({
        success: false,
        message:
          "A certificate has already been issued for this membership",
        certificate: existingCertificate,
      });
    }

    const user = await User.findById(
      membership.user
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Membership user not found",
      });
    }

    const certificate = await Certificate.create({
      certificateId: generateCertificateId(),
      user: user._id,
      membership: membership._id,
      issueDate: membership.startDate,
      expiryDate: membership.expiryDate,
      status: "active",
    });

    try {
      await sendCertificateIssuedEmail(
        user.email,
        user.name,
        certificate.certificateId
      );
    } catch (emailError) {
      console.error("Certificate issue email failed:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      certificate,
    });
  } catch (error) {
    console.error(
      "Issue certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while issuing certificate",
    });
  }
}

export async function getMyCertificate(
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

    const certificate =
      await Certificate.findOne({
        user: userId,
      })
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
        });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error(
      "Get my certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting certificate",
    });
  }
}

export async function getAllCertificates(
  req: AuthRequest,
  res: Response
) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status =
      typeof req.query.status === "string" &&
      ["active", "expired", "revoked"].includes(req.query.status)
        ? req.query.status
        : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      filter.certificateId = {
        $regex: escapeRegExp(search),
        $options: "i",
      };
    }
    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
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
        .skip((page - 1) * limit)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "Get all certificates error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting certificates",
    });
  }
}

export async function verifyCertificate(
  req: AuthRequest,
  res: Response
) {
  try {
    const certificateId = String(
      req.params.certificateId
    )
      .trim()
      .toUpperCase();

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: "Certificate ID is required",
      });
    }

    const certificate =
      await Certificate.findOne({
        certificateId,
      })
        .populate(
          "user",
          "name"
        )
        .populate(
          "membership",
          "status paymentStatus startDate expiryDate"
        );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
        verified: false,
      });
    }

    const now = new Date();

    if (
      certificate.status === "active" &&
      certificate.expiryDate < now
    ) {
      certificate.status = "expired";
      await certificate.save();
    }

    const verified =
      certificate.status === "active";

    return res.status(200).json({
      success: true,
      verified,
      certificate,
    });
  } catch (error) {
    console.error(
      "Verify certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while verifying certificate",
    });
  }
}

export async function revokeCertificate(
  req: AuthRequest,
  res: Response
) {
  try {
    const certificateId = String(
      req.params.certificateId
    )
      .trim()
      .toUpperCase();

    const certificate =
      await Certificate.findOne({
        certificateId,
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    if (certificate.status === "revoked") {
      return res.status(400).json({
        success: false,
        message: "Certificate is already revoked",
      });
    }

    certificate.status = "revoked";

    await certificate.save();

    return res.status(200).json({
      success: true,
      message: "Certificate revoked successfully",
      certificate,
    });
  } catch (error) {
    console.error(
      "Revoke certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while revoking certificate",
    });
  }
}

export async function downloadCertificatePDF(
  req: AuthRequest,
  res: Response
) {
  try {
    const certificateId = String(
      req.params.certificateId
    )
      .trim()
      .toUpperCase();

    const certificate =
      await Certificate.findOne({
        certificateId,
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    const user = await User.findById(
      certificate.user
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Certificate user not found",
      });
    }

    const membership =
      await Membership.findById(
        certificate.membership
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    const plan =
      await MembershipPlan.findById(
        membership.plan
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is missing from .env");
    }

    const verificationUrl = new URL(
      `/verify/${encodeURIComponent(certificate.certificateId)}`,
      frontendUrl
    ).toString();

    const qrDataUrl = await QRCode.toDataURL(
      verificationUrl,
      {
        width: 180,
        margin: 2,
      }
    );

    const qrBase64 = qrDataUrl.replace(
      /^data:image\/png;base64,/,
      ""
    );

    const qrBuffer = Buffer.from(
      qrBase64,
      "base64"
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${certificate.certificateId}.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc
      .lineWidth(2)
      .strokeColor("#6C63FF")
      .roundedRect(32, 32, pageWidth - 64, pageHeight - 64, 18)
      .stroke();
    doc
      .lineWidth(1)
      .strokeColor("#00D4FF")
      .moveTo(100, 170)
      .lineTo(pageWidth - 100, 170)
      .stroke();

    doc
      .fontSize(30)
      .font("Helvetica-Bold")
      .text(
        "E-MEMBERSHIP",
        50,
        80,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc
      .moveDown(0.5)
      .fontSize(18)
      .font("Helvetica")
      .text(
        "MEMBERSHIP CERTIFICATE",
        {
          align: "center",
        }
      );

    doc
      .moveTo(100, 155)
      .lineTo(pageWidth - 100, 155)
      .stroke();

    doc
      .fontSize(15)
      .font("Helvetica")
      .text(
        "This certificate is proudly presented to",
        50,
        200,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .text(
        user.name,
        50,
        240,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc
      .fontSize(15)
      .font("Helvetica")
      .text(
        "for successfully holding an active membership",
        50,
        300,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(
        plan.name,
        50,
        340,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc
      .fontSize(13)
      .font("Helvetica")
      .text(
        `Duration: ${plan.durationDays} days`,
        50,
        380,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    const issueDate =
      certificate.issueDate.toLocaleDateString(
        "en-GB"
      );

    const expiryDate =
      certificate.expiryDate.toLocaleDateString(
        "en-GB"
      );

    doc
      .fontSize(13)
      .text(
        `Issue Date: ${issueDate}`,
        100,
        440
      );

    doc
      .fontSize(13)
      .text(
        `Expiry Date: ${expiryDate}`,
        350,
        440
      );

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(
        `Certificate ID: ${certificate.certificateId}`,
        50,
        500,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc.image(
      qrBuffer,
      pageWidth - 230,
      pageHeight - 270,
      {
        width: 150,
        height: 150,
      }
    );

    doc
      .moveTo(70, pageHeight - 175)
      .lineTo(270, pageHeight - 175)
      .strokeColor("#6C63FF")
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Digital signature", 70, pageHeight - 160);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("E-Membership Certificate Authority", 70, pageHeight - 142)
      .text(
        `Verified certificate: ${certificate.certificateId}`,
        70,
        pageHeight - 125,
        { width: 220 }
      );

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Scan QR code to verify this certificate",
        pageWidth - 260,
        pageHeight - 105,
        {
          width: 210,
          align: "center",
        }
      );

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        "This certificate is digitally issued by E-Membership.",
        50,
        pageHeight - 80,
        {
          align: "center",
          width: pageWidth - 100,
        }
      );

    doc.end();
  } catch (error) {
    console.error(
      "Download certificate PDF error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Server error while generating certificate PDF",
      });
    }
  }
}