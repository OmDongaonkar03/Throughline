import cron from "node-cron";
import { checkSchedules } from "../jobs/check-schedules.js";
import { processGenerationJobs, cleanupOldJobs } from "../jobs/process-jobs.js";

/**
 * Start the job scheduler
 * Sets up cron jobs for checking schedules and processing generation jobs
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
  // Checks which users need posts generated and processes pending jobs
  cron.schedule("*/15 * * * *", async () => {
    console.log(`[Scheduler] Time: ${new Date().toISOString()}`);

    try {
      // Step 1: Check schedules and create jobs
      await checkSchedules();

      // Step 2: Process pending jobs
      await processGenerationJobs();
    } catch (error) {
      console.error("[Scheduler] Error in scheduled task:", error);
    }

    console.log("[Scheduler] === Scheduled tasks complete ===\n");
  });

  // Clean up old completed jobs daily at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("[Scheduler] Running daily cleanup...");
    try {
      await cleanupOldJobs(7); // Keep last 7 days
    } catch (error) {
      console.error("[Scheduler] Error in cleanup:", error);
    }
  });

  console.log("[Scheduler] Scheduler started");
  console.log("[Scheduler] - Main task: Every 15 minutes");
  console.log("[Scheduler] - Cleanup: Daily at 3 AM");
}

/**
 * Stop the scheduler
 * Useful for testing or graceful shutdown
 */
export function stopScheduler() {
  cron.getTasks().forEach((task) => task.stop());
  console.log("[Scheduler] Scheduler stopped");
}
