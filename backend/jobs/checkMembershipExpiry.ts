import cron from "node-cron";
import { processExpiredRecords } from "../services/expiryService";

async function runExpiryCheck(): Promise<void> {
  try {
    await processExpiredRecords();
  } catch (error) {
    console.error("[Expiry Job] Scheduled check failed:", error);
  }
}

export function startMembershipExpiryJob(): void {
  cron.schedule("0 * * * *", runExpiryCheck);
  console.log("[Expiry Job] Membership and certificate expiry checks scheduled hourly.");
}