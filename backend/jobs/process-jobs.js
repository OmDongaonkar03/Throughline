import prisma from "../db/prisma.js";
import logger from '../utils/logger.js';
import {
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
} from "../mastra/index.js";

export async function processGenerationJobs() {
  logger.info('Job processor started');

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
    logger.debug('No pending jobs found');
    return;
  }

  logger.info('Processing generation jobs', {
    jobCount: jobs.length
  });

  for (const job of jobs) {
    try {
      logger.info('Processing job', {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        date: job.date.toISOString().split('T')[0]
      });

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

      logger.info('Post generation completed', {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        postId: result.basePost.id,
        platformsSucceeded: result.generated,
        platformsFailed: result.failed
      });

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          logger.warn('Platform generation failed', {
            jobId: job.id,
            userId: job.userId,
            platform: error.platform,
            error: error.error
          });
        });
      }

      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      logger.info('Job completed successfully', {
        jobId: job.id,
        userId: job.userId,
        type: job.type
      });
    } catch (error) {
      logger.error('Job processing failed', {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        error: error.message,
        stack: error.stack
      });

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

  logger.info('Job processor completed', {
    processedCount: jobs.length
  });
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

  logger.info('Old jobs cleaned up', {
    deletedCount: deleted.count,
    daysKept: daysToKeep,
    cutoffDate: cutoffDate.toISOString().split('T')[0]
  });

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
    logger.warn('Stalled jobs detected', {
      stalledCount: stalledJobs.length,
      timeoutMinutes: 30
    });

    for (const job of stalledJobs) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: "Job stalled - exceeded 30 minute timeout",
          completedAt: new Date(),
        },
      });

      logger.warn('Stalled job reset', {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        startedAt: job.startedAt.toISOString(),
        stalledDuration: Math.round((new Date() - job.startedAt) / 60000) + ' minutes'
      });
    }

    logger.info('Stalled jobs cleanup completed', {
      resetCount: stalledJobs.length
    });
  }

  return stalledJobs.length;
}