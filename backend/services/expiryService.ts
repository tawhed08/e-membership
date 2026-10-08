import Certificate from "../models/Certificate";
import Membership from "../models/Membership";
import User from "../models/User";

export async function processExpiredRecords(): Promise<void> {
  const now = new Date();
  const expiryFilter = {
    status: "active",
    expiryDate: {
      $exists: true,
      $lte: now,
    },
  } as const;

  const expiredUserIds = await Membership.distinct(
    "user",
    expiryFilter
  );
  const expiredMemberships = await Membership.updateMany(
    expiryFilter,
    { $set: { status: "expired" } }
  );
  const expiredCertificates = await Certificate.updateMany(
    {
      status: "active",
      expiryDate: {
        $exists: true,
        $lte: now,
      },
    },
    { $set: { status: "expired" } }
  );

  const activeUserIds = await Membership.distinct("user", {
    status: "active",
    expiryDate: { $gt: now },
  });
  const usersToDeactivate = expiredUserIds.filter(
    (userId) =>
      !activeUserIds.some((activeUserId) =>
        activeUserId.equals(userId)
      )
  );

  if (usersToDeactivate.length > 0) {
    await User.updateMany(
      {
        role: "user",
        suspendedByAdmin: { $ne: true },
        _id: { $in: usersToDeactivate },
      },
      { $set: { isActive: false, suspendedByAdmin: false } }
    );
  }

  if (activeUserIds.length > 0) {
    await User.updateMany(
      {
        role: "user",
        suspendedByAdmin: { $ne: true },
        _id: { $in: activeUserIds },
      },
      { $set: { isActive: true } }
    );
  }

  console.log(
    `[Expiry Service] Checked at ${now.toISOString()}`
  );
  console.log(
    `[Expiry Service] Memberships expired: ${expiredMemberships.modifiedCount}`
  );
  console.log(
    `[Expiry Service] Certificates expired: ${expiredCertificates.modifiedCount}`
  );
}
