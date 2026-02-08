import Redis from 'ioredis';

let redisClient = null;

/**
 * Get or create Redis client singleton
 * @returns {Redis} Redis client instance
 */
export function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

  try {
    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: true,
      });
    } else {
      redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        db: redisDb,
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: true,
      });
    }

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    redisClient.on('error', (error) => {
      console.error('[Redis] Connection error:', error.message);
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    throw error;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed gracefully');
  }
}

/**
 * Check if Redis is available
 * @returns {Promise<boolean>} True if Redis is reachable
 */
export async function isRedisAvailable() {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error.message);
    return false;
  }
}

export default getRedisClient();