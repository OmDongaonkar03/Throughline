import { Queue } from "bullmq";
import {
  getRedisConnection,
  QUEUE_NAMES,
  defaultJobOptions,
  retryConfig,
  JOB_PRIORITY,
} from "./config.js";

// Create the queue
export const postGenerationQueue = new Queue(QUEUE_NAMES.POST_GENERATION, {
  ...getRedisConnection(),
  defaultJobOptions,
});

/**
 * Add a post generation job to the queue
 * Prevents duplicate jobs for same user/date/type
 *
 * @param {Object} data - Job data
 * @param {string} data.userId - User ID
 * @param {string} data.type - Post type (DAILY, WEEKLY, MONTHLY)
 * @param {Date} data.date - Post date
 * @param {boolean} data.isManual - Whether manually triggered
 * @param {string} data.postId - For regeneration jobs
 * @returns {Promise<Job>} The created job
 */
export async function addPostGenerationJob(data) {
  const { userId, type, date, isManual = false, postId } = data;

  // Generate unique job ID to prevent duplicates (no colons allowed in BullMQ)
  const jobId = postId
    ? `regen-${userId}-${postId}-${Date.now()}`
    : `${type}-${userId}-${new Date(date).toISOString()}`;

  const existingJobs = await postGenerationQueue.getJobs(["waiting", "active"]);
  const duplicateJob = existingJobs.find((job) => {
    if (postId) {
      // For regeneration, allow if different timestamp
      return job.data.postId === postId && job.data.userId === userId;
    }
    // For generation, prevent exact duplicates
    return (
      job.data.userId === userId &&
      job.data.type === type &&
      new Date(job.data.date).toISOString() === new Date(date).toISOString()
    );
  });

  if (duplicateJob) {
    console.log(`[Post Queue] Job already exists: ${duplicateJob.id}`);
    return duplicateJob;
  }

  const priority = isManual ? JOB_PRIORITY.HIGH : JOB_PRIORITY.NORMAL;

  const job = await postGenerationQueue.add(
    type === "REGENERATE"
      ? "regenerate-post"
      : `generate-${type.toLowerCase()}-post`,
    {
      userId,
      type,
      date: new Date(date).toISOString(),
      isManual,
      postId,
    },
    {
      jobId,
      priority,
      ...retryConfig,
    },
  );

  console.log(`[Post Queue] Added job ${job.id} (priority: ${priority})`);
  return job;
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId) {
  const job = await postGenerationQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  };
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(userId) {
  const jobs = await postGenerationQueue.getJobs([
    "waiting",
    "active",
    "completed",
    "failed",
  ]);
  return jobs.filter((job) => job.data.userId === userId);
}