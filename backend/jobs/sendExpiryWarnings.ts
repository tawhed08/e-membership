import cron from "node-cron";
import { sendUpcomingExpiryNotifications } from "../services/notificationService";

async function runExpiryWarnings(): Promise<void> {
  try {
    await sendUpcomingExpiryNotifications();
  } catch (error) {
    console.error("[Expiry Notification Job] Scheduled notifications failed:", error);
  }
}

export function startExpiryWarningJob(): void {
  cron.schedule("0 9 * * *", runExpiryWarnings);
  console.log("[Expiry Notification Job] Expiry emails scheduled daily at 09:00.");
  void runExpiryWarnings();
}