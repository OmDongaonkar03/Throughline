import { Worker } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES } from '../queues/config.js';
import prisma from '../db/prisma.js';
import {
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
  regeneratePost,
} from '../mastra/index.js';

// Create worker with single concurrency
export const postGenerationWorker = new Worker(
  QUEUE_NAMES.POST_GENERATION,
  async (job) => {
    const { userId, type, date, isManual, postId } = job.data;

    console.log(`[Post Worker] Processing job ${job.id} - ${type} for user ${userId}`);

    try {
      // Check if post already exists before generating
      if (!postId) {
        const existingPost = await prisma.generatedPost.findFirst({
          where: {
            userId,
            type,
            date: new Date(date),
            isLatest: true,
          },
        });

        if (existingPost) {
          console.log(`[Post Worker] Post already exists for ${type} on ${date}, skipping`);
          return {
            success: true,
            skipped: true,
            postId: existingPost.id,
            message: 'Post already exists',
          };
        }
      }

      let result;

      // Process based on job type
      if (postId) {
        // Regeneration
        result = await regeneratePost(postId, userId, prisma);
      } else {
        // New generation
        switch (type) {
          case 'DAILY':
            result = await generateCompleteDailyPosts(userId, new Date(date), prisma, isManual);
            break;

          case 'WEEKLY':
            result = await generateCompleteWeeklyPosts(userId, new Date(date), prisma, isManual);
            break;

          case 'MONTHLY':
            result = await generateCompleteMonthlyPosts(userId, new Date(date), prisma, isManual);
            break;

          default:
            throw new Error(`Unsupported post type: ${type}`);
        }
      }

      console.log(`[Post Worker] Job ${job.id} completed - Post ID: ${result.basePost.id}`);

      return {
        success: true,
        postId: result.basePost.id,
        generated: result.generated,
        failed: result.failed,
      };
    } catch (error) {
      console.error(`[Post Worker] Job ${job.id} failed:`, error);

      // Determine if error is retryable
      const isRetryable = isRetryableError(error);

      if (!isRetryable) {
        // Mark job as failed permanently
        console.log(`[Post Worker] Non-retryable error, failing immediately`);
        await job.moveToFailed(
          {
            message: error.message,
            retryable: false,
          },
          true // ignoreLock
        );
      }

      throw error; // Re-throw to let BullMQ handle retries
    }
  },
  {
    ...getRedisConnection(),
    concurrency: 1, // Single worker
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  }
);

/**
 * Determine if an error is retryable
 */
function isRetryableError(error) {
  const errorMessage = error.message.toLowerCase();

  // Non-retryable errors (user/data issues)
  const nonRetryablePatterns = [
    'not found',
    'user not found',
    'tone profile',
    'invalid date',
    'does not belong',
    'unauthorized',
    'forbidden',
  ];

  for (const pattern of nonRetryablePatterns) {
    if (errorMessage.includes(pattern)) {
      return false;
    }
  }

  // (LLM failures, network issues, etc.)
  return true;
}

// Worker event handlers
postGenerationWorker.on('completed', (job, returnvalue) => {
  console.log(`[Post Worker] Job ${job.id} completed successfully`);
  if (returnvalue.skipped) {
    console.log(`[Post Worker] Job was skipped: ${returnvalue.message}`);
  }
});

postGenerationWorker.on('failed', (job, error) => {
  console.error(`[Post Worker] Job ${job?.id} failed: ${error.message}`);
});

postGenerationWorker.on('stalled', (jobId) => {
  console.warn(`[Post Worker] Job ${jobId} stalled`);
});

postGenerationWorker.on('error', (error) => {
  console.error('[Post Worker] Worker error:', error);
});

console.log('[Post Worker] Worker started with concurrency: 1');