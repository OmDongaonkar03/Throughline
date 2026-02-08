import { getRedisClient } from '../utils/redis.js';

/**
 * Get Redis connection config for BullMQ
 */
export function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

  if (redisUrl) {
    return {
      connection: redisUrl,
    };
  }

  return {
    connection: {
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      db: redisDb,
    },
  };
}

/**
 * Default job options for all queues
 */
export const defaultJobOptions = {
  removeOnComplete: {
    count: parseInt(process.env.BULLMQ_REMOVE_ON_COMPLETE || '100', 10),
  },
  removeOnFail: {
    count: parseInt(process.env.BULLMQ_REMOVE_ON_FAIL || '500', 10),
  },
};

/**
 * Retry configuration
 */
export const retryConfig = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s
  },
};

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  POST_GENERATION: 'post-generation',
  EMAIL_SENDING: 'email-sending',
};

/**
 * Job priorities
 */
export const JOB_PRIORITY = {
  HIGH: 10,    // Manual user-initiated
  NORMAL: 5,   // Scheduled
  LOW: 1,      // Background tasks
};