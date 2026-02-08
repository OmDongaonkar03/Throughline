import { Worker } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES } from '../queues/config.js';
import { sendMail } from '../utils/mail.js';
import { verificationEmailTemplate } from '../templates/verificationEmail.js';
import { passwordResetEmailTemplate } from '../templates/passwordResetEmail.js';

// Create worker with single concurrency
export const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL_SENDING,
  async (job) => {
    const { name: jobName, data } = job;

    console.log(`[Email Worker] Processing job ${job.id} - ${jobName}`);

    try {
      if (jobName === 'send-verification-email') {
        await sendVerificationEmail(data);
      } else if (jobName === 'send-password-reset-email') {
        await sendPasswordResetEmail(data);
      } else {
        throw new Error(`Unknown job type: ${jobName}`);
      }

      console.log(`[Email Worker] Job ${job.id} completed - Email sent to ${data.email}`);

      return {
        success: true,
        email: data.email,
      };
    } catch (error) {
      console.error(`[Email Worker] Job ${job.id} failed:`, error);

      // Determine if error is retryable
      const isRetryable = isRetryableError(error);

      if (!isRetryable) {
        console.log(`[Email Worker] Non-retryable error, failing immediately`);
        await job.moveToFailed(
          {
            message: error.message,
            retryable: false,
          },
          true
        );
      }

      throw error;
    }
  },
  {
    ...getRedisConnection(),
    concurrency: 1, // Single worker
    removeOnComplete: { age: 3600 },
    removeOnFail: { count: 100 },
  }
);

/**
 * Send verification email
 */
async function sendVerificationEmail(data) {
  const { email, name, verificationToken } = data;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const emailContent = verificationEmailTemplate({
    name,
    verificationLink,
  });

  // Note: sendMail has built-in retry, but we're letting BullMQ handle retries
  // So we'll call it without the internal retry
  await sendMail(
    {
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    },
    1 // Single attempt, BullMQ handles retries
  );
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(data) {
  const { email, name, resetToken } = data;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const emailContent = passwordResetEmailTemplate({
    name,
    resetLink,
  });

  await sendMail(
    {
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    },
    1 // Single attempt, BullMQ handles retries
  );
}

/**
 * Determine if email error is retryable
 */
function isRetryableError(error) {
  const errorMessage = error.message.toLowerCase();

  // Non-retryable errors
  const nonRetryablePatterns = [
    'invalid email',
    'user not found',
    'recipient rejected', // Permanent SMTP error
    '5.', // SMTP 5xx errors are permanent
  ];

  for (const pattern of nonRetryablePatterns) {
    if (errorMessage.includes(pattern)) {
      return false;
    }
  }

  // Retryable: timeouts, 4xx SMTP errors, network issues
  return true;
}

// Worker event handlers
emailWorker.on('completed', (job, returnvalue) => {
  console.log(`[Email Worker] Job ${job.id} completed - Email sent to ${returnvalue.email}`);
});

emailWorker.on('failed', (job, error) => {
  console.error(`[Email Worker] Job ${job?.id} failed: ${error.message}`);
});

emailWorker.on('stalled', (jobId) => {
  console.warn(`[Email Worker] Job ${jobId} stalled`);
});

emailWorker.on('error', (error) => {
  console.error('[Email Worker] Worker error:', error);
});

console.log('[Email Worker] Worker started with concurrency: 1');