import cron from "node-cron";
import logger from './logger.js';
import { checkSchedules } from "../jobs/check-schedules.js";
import { processGenerationJobs, cleanupOldJobs } from "../jobs/process-jobs.js";

/**
 * Start the job scheduler
 * Sets up cron jobs for checking schedules and processing generation jobs
 */
export function startScheduler() {
  // Skip if disabled (for advanced users using external cron)
  if (process.env.DISABLE_INTERNAL_CRON === "true") {
    logger.info('Internal scheduler disabled', {
      reason: 'DISABLE_INTERNAL_CRON=true',
      mode: 'external_cron'
    });
    return;
  }

  logger.info('Job scheduler starting');

  // Run every 15 minutes
  // Checks which users need posts generated and processes pending jobs
  cron.schedule("*/15 * * * *", async () => {
    const startTime = Date.now();
    logger.info('Scheduled task execution started', {
      timestamp: new Date().toISOString(),
      schedule: 'every_15_minutes'
    });

    try {
      // Step 1: Check schedules and create jobs
      await checkSchedules();

      // Step 2: Process pending jobs
      await processGenerationJobs();

      const duration = Date.now() - startTime;
      logger.info('Scheduled task execution completed', {
        durationMs: duration,
        durationSeconds: Math.round(duration / 1000)
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Scheduled task execution failed', {
        error: error.message,
        stack: error.stack,
        durationMs: duration
      });
    }
  });

  // Clean up old completed jobs daily at 3 AM
  cron.schedule("0 3 * * *", async () => {
    logger.info('Daily cleanup task started', {
      timestamp: new Date().toISOString(),
      schedule: '3_AM_daily'
    });

    const startTime = Date.now();
    try {
      const deletedCount = await cleanupOldJobs(7); // Keep last 7 days
      const duration = Date.now() - startTime;
      
      logger.info('Daily cleanup task completed', {
        deletedJobs: deletedCount,
        daysKept: 7,
        durationMs: duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Daily cleanup task failed', {
        error: error.message,
        stack: error.stack,
        durationMs: duration
      });
    }
  });

  logger.info('Job scheduler started successfully', {
    mainTask: 'every_15_minutes',
    cleanupTask: 'daily_3am',
    cronEnabled: true
  });
}

/**
 * Stop the scheduler
 * Useful for testing or graceful shutdown
 */
export function stopScheduler() {
  const tasks = cron.getTasks();
  const taskCount = tasks.size;
  
  tasks.forEach((task) => task.stop());
  
  logger.info('Job scheduler stopped', {
    stoppedTasks: taskCount
  });
}