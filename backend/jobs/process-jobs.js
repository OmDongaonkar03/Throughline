import prisma from "../db/prisma.js";
import {
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
} from "../mastra/index.js";

export async function processGenerationJobs() {
  console.log("[Process Jobs] Checking for pending jobs...");

  await cleanupStalledJobs();

  const jobs = await prisma.$transaction(async (tx) => {
    const pendingJobs = await tx.generationJob.findMany({
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
      take: 10,
      orderBy: {
        createdAt: "asc",
      },
    });

    if (pendingJobs.length === 0) {
      return [];
    }

    const jobIds = pendingJobs.map(j => j.id);
    await tx.generationJob.updateMany({
      where: {
        id: { in: jobIds },
      },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
      },
    });

    return pendingJobs;
  });

  if (jobs.length === 0) {
    console.log("[Process Jobs] No pending jobs found");
    return;
  }

  console.log(`[Process Jobs] Processing ${jobs.length} jobs`);

  for (const job of jobs) {
    try {
      console.log(`[Process Jobs] Processing job ${job.id} for user ${job.userId} (type: ${job.type})`);

      let result;
      
      switch (job.type) {
        case "DAILY":
          result = await generateCompleteDailyPosts(
            job.userId,
            job.date,
            prisma,
            false
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

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.error(`[Process Jobs] Platform ${error.platform} failed: ${error.error}`);
        });
      }

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

  console.log(`[Process Jobs] Processed ${jobs.length} jobs`);
}

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