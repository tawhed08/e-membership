import Membership from "../models/Membership";
import Notification from "../models/Notification";
import User from "../models/User";
import { sendExpiryEmail } from "./emailService";

const expiryReminders = [30, 7, 1] as const;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function sendUpcomingExpiryNotifications(): Promise<void> {
  const failures: Error[] = [];

  for (const daysBefore of expiryReminders) {
    const targetDay = new Date();
    targetDay.setHours(0, 0, 0, 0);
    targetDay.setDate(targetDay.getDate() + daysBefore);
    const nextDay = new Date(targetDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const memberships = await Membership.find({
      status: "active",
      expiryDate: {
        $gte: targetDay,
        $lt: nextDay,
      },
    });

    for (const membership of memberships) {
      let notification;

      try {
        const user = await User.findById(membership.user).select(
          "name email"
        );

        if (!user) {
          throw new Error(
            `No user found for membership ${membership._id}`
          );
        }
        if (!membership.expiryDate) {
          throw new Error(
            `Membership ${membership._id} has no expiry date`
          );
        }

        const message = `Your membership expires in ${daysBefore} day${daysBefore === 1 ? "" : "s"}.`;
        notification = await Notification.create({
          user: user._id,
          membership: membership._id,
          type: "expiry_warning",
          daysBefore,
          title: "Membership expiry reminder",
          message,
        });

        const emailSent = await sendExpiryEmail({
          email: user.email,
          name: user.name,
          daysBefore,
          expiryDate: membership.expiryDate,
        });

        if (emailSent) {
          notification.sentAt = new Date();
          await notification.save();
        }
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          continue;
        }

        if (notification) {
          await Notification.deleteOne({ _id: notification._id });
        }

        const failure =
          error instanceof Error ? error : new Error(String(error));
        failures.push(failure);
        console.error(
          `[Notification Service] Failed to send ${daysBefore}-day reminder for membership ${membership._id}:`,
          failure
        );
      }
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      "One or more membership expiry notifications could not be sent"
    );
  }
}