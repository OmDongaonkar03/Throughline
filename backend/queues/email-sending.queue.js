import { Queue } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, retryConfig } from './config.js';

// Create the queue with shorter retention for emails
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL_SENDING, {
  ...getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // Remove after 1 hour
    },
    removeOnFail: {
      count: 100, // Keep last 100 failed
    },
  },
});

/**
 * Add verification email job
 */
export async function addVerificationEmailJob(data) {
  const { userId, email, name, verificationToken } = data;

  const job = await emailQueue.add(
    'send-verification-email',
    {
      userId,
      email,
      name,
      verificationToken,
    },
    {
      ...retryConfig,
    }
  );

  console.log(`[Email Queue] Added verification email job ${job.id} for ${email}`);
  return job;
}

/**
 * Add password reset email job
 */
export async function addPasswordResetEmailJob(data) {
  const { userId, email, name, resetToken } = data;

  const job = await emailQueue.add(
    'send-password-reset-email',
    {
      userId,
      email,
      name,
      resetToken,
    },
    {
      ...retryConfig,
    }
  );

  console.log(`[Email Queue] Added password reset email job ${job.id} for ${email}`);
  return job;
}