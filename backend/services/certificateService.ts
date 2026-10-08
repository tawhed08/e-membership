import crypto from "crypto";
import mongoose from "mongoose";

import Certificate from "../models/Certificate";
import Membership from "../models/Membership";
import User from "../models/User";

function generateCertificateId(): string {
  return `EM-${Date.now()
    .toString(36)
    .toUpperCase()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

interface CreateCertificateOptions {
  session?: mongoose.ClientSession;
}

export async function createCertificateForMembership(
  membershipId: mongoose.Types.ObjectId | string,
  options: CreateCertificateOptions = {}
) {
  const existingCertificate = await Certificate.findOne({
    membership: membershipId,
  }).session(options.session ?? null);

  if (existingCertificate) {
    return existingCertificate;
  }

  const membership = await Membership.findById(membershipId)
    .populate("user", "name email phone")
    .session(options.session ?? null);

  if (!membership) {
    throw new Error("Membership not found.");
  }

  if (membership.status !== "active") {
    throw new Error(
      "Certificate can only be created for an active membership."
    );
  }

  if (membership.paymentStatus !== "paid") {
    throw new Error(
      "Certificate can only be created after payment is completed."
    );
  }

  if (!membership.startDate || !membership.expiryDate) {
    throw new Error(
      "Membership start and expiry dates are required."
    );
  }

  const user =
    membership.user &&
    typeof membership.user === "object" &&
    "email" in membership.user
      ? membership.user
      : await User.findById(membership.user).session(
          options.session ?? null
        );

  if (!user) {
    throw new Error("Membership user not found.");
  }

  let certificateId = generateCertificateId();

  // Very unlikely collision protection.
  while (
    await Certificate.exists({
      certificateId,
    }).session(options.session ?? null)
  ) {
    certificateId = generateCertificateId();
  }

  const [certificate] = await Certificate.create(
    [
      {
        certificateId,
        user: membership.user,
        membership: membership._id,
        issueDate: new Date(),
        expiryDate: membership.expiryDate,
        status: "active",
      },
    ],
    options.session
      ? { session: options.session }
      : undefined
  );

  return certificate;
}