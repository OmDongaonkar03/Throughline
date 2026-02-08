import cron from "node-cron";
import { checkSchedules } from "../jobs/check-schedules.js";

/**
 * Start the job scheduler
 * Sets up cron jobs for checking schedules
 * Note: Job processing is now handled by BullMQ workers
 */
export function startScheduler() {
  // Skip if disabled (for advanced users using external cron)
  if (process.env.DISABLE_INTERNAL_CRON === "true") {
    console.log(
      "[Scheduler] Internal scheduler disabled via DISABLE_INTERNAL_CRON"
    );
    return;
  }

  console.log("[Scheduler] Starting job scheduler...");

  // Run every 15 minutes
  // Checks which users need posts generated and adds jobs to BullMQ queue
  cron.schedule("*/15 * * * *", async () => {
    console.log(`[Scheduler] Time: ${new Date().toISOString()}`);

    try {
      await checkSchedules();
    } catch (error) {
      console.error("[Scheduler] Error in scheduled task:", error);
    }

    console.log("[Scheduler] === Scheduled tasks complete ===\n");
  });

  console.log("[Scheduler] Scheduler started");
  console.log("[Scheduler] - Check schedules: Every 15 minutes");
  console.log("[Scheduler] - Job processing: Handled by BullMQ workers");
}

/**
 * Stop the scheduler
 * Useful for testing or graceful shutdown
 */
export function stopScheduler() {
  cron.getTasks().forEach((task) => task.stop());
  console.log("[Scheduler] Scheduler stopped");
}