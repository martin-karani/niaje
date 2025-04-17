import { SERVER_CONFIG } from "@/config/environment";
import cron from "node-cron";
import { processLeaseReminders } from "./lease-reminders";
import { processTrials } from "./process-trials";
// import { processRentReminders } from "./rent-reminders";
// import { processUtilityBills } from "./utility-bills";

export function startScheduler() {
  console.log("Starting scheduled tasks...");

  // Process trials daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled trial processing...");
    await processTrials();
  });

  // Process lease expiry reminders daily at 1 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("Running scheduled lease reminder processing...");
    await processLeaseReminders();
  });

  // // Process rent reminders daily at 2 AM
  // cron.schedule("0 2 * * *", async () => {
  //   console.log("Running scheduled rent reminder processing...");
  //   await processRentReminders();
  // });

  // // Process utility bills on the 1st of each month at 3 AM
  // cron.schedule("0 3 1 * *", async () => {
  //   console.log("Running scheduled utility bill processing...");
  //   await processUtilityBills();
  // });

  // Log that scheduler has started
  console.log("Scheduled tasks started");

  // Only log detailed schedule in development
  if (SERVER_CONFIG.NODE_ENV === "development") {
    console.log("Scheduled tasks:");
    console.log("- Trial processing: 0 0 * * * (daily at midnight)");
    console.log("- Lease reminders: 0 1 * * * (daily at 1 AM)");
    console.log("- Rent reminders: 0 2 * * * (daily at 2 AM)");
    console.log("- Utility bills: 0 3 1 * * (1st of month at 3 AM)");
  }
}
