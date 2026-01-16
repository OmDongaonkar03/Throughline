import prisma from "../db/prisma.js";
import {
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
} from "../mastra/index.js";

/**
 * Process pending generation jobs
 * Called by scheduler every 15 minutes
 */
export async function processGenerationJobs() {
  console.log("[Process Jobs] Checking for pending jobs...");

  // First, clean up any stalled jobs
  await cleanupStalledJobs();

  const pendingJobs = await prisma.generationJob.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      user: {
        include: {
          toneProfile: true,
        },
      },
    },
    take: 10, // Process max 10 jobs per run
    orderBy: {
      createdAt: "asc",
    },
  });

  if (pendingJobs.length === 0) {
    console.log("[Process Jobs] No pending jobs found");
    return;
  }

  console.log(`[Process Jobs] Found ${pendingJobs.length} pending jobs`);

  for (const job of pendingJobs) {
    try {
      console.log(`[Process Jobs] Processing job ${job.id} for user ${job.userId} (type: ${job.type})`);

      // Mark as processing
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "PROCESSING",
          startedAt: new Date(),
        },
      });

      // Generate using orchestrated functions
      let result;
      
      switch (job.type) {
        case "DAILY":
          result = await generateCompleteDailyPosts(
            job.userId,
            job.date,
            prisma,
            false // isManual = false for scheduled jobs
          );
          break;
          
        case "WEEKLY":
          result = await generateCompleteWeeklyPosts(
            job.userId,
            job.date,
            prisma,
            false
          );
          break;
          
        case "MONTHLY":
          result = await generateCompleteMonthlyPosts(
            job.userId,
            job.date,
            prisma,
            false
          );
          break;
          
        default:
          throw new Error(`Unsupported post type: ${job.type}`);
      }

      console.log(`[Process Jobs] Generated ${job.type} post: ${result.basePost.id}`);
      console.log(`[Process Jobs] Platform posts: ${result.generated} succeeded, ${result.failed} failed`);

      // Log any platform errors
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.error(`[Process Jobs] Platform ${error.platform} failed: ${error.error}`);
        });
      }

      // Mark job as completed
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      console.log(`[Process Jobs] Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`[Process Jobs] Job ${job.id} failed:`, error);

      // Mark job as failed
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }

  console.log(`[Process Jobs] Processed ${pendingJobs.length} jobs`);
}

/**
 * Clean up old completed/failed jobs
 * Keeps only last N days of jobs
 */
export async function cleanupOldJobs(daysToKeep = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deleted = await prisma.generationJob.deleteMany({
    where: {
      status: {
        in: ["COMPLETED", "FAILED"],
      },
      completedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[Cleanup] Deleted ${deleted.count} old jobs`);
  return deleted.count;
}

/**
 * Clean up stalled jobs
 * Jobs stuck in PROCESSING for more than 30 minutes
 */
export async function cleanupStalledJobs() {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);

  const stalledJobs = await prisma.generationJob.findMany({
    where: {
      status: "PROCESSING",
      startedAt: {
        lt: cutoffTime,
      },
    },
  });

  if (stalledJobs.length > 0) {
    console.log(`[Cleanup] Found ${stalledJobs.length} stalled jobs`);

    for (const job of stalledJobs) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: "Job stalled - exceeded 30 minute timeout",
          completedAt: new Date(),
        },
      });
    }

    console.log(`[Cleanup] Reset ${stalledJobs.length} stalled jobs to FAILED`);
  }

  return stalledJobs.length;
}