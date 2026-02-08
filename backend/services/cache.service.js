import redis from '../utils/redis.js';

const USER_PROFILE_TTL = 3600; // 1 hour
const USER_PROFILE_PREFIX = 'user:profile:';

/**
 * Get user profile from cache
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile or null if not cached
 */
export async function getCachedUserProfile(userId) {
  try {
    const key = `${USER_PROFILE_PREFIX}${userId}`;
    const cached = await redis.get(key);

    if (cached) {
      console.log(`[Cache] HIT - User profile: ${userId}`);
      return JSON.parse(cached);
    }

    console.log(`[Cache] MISS - User profile: ${userId}`);
    return null;
  } catch (error) {
    console.error('[Cache] Error reading user profile:', error);
    return null; // Fallback to database on error
  }
}

/**
 * Set user profile in cache
 * @param {string} userId - User ID
 * @param {Object} profile - User profile data
 */
export async function setCachedUserProfile(userId, profile) {
  try {
    const key = `${USER_PROFILE_PREFIX}${userId}`;
    await redis.setex(key, USER_PROFILE_TTL, JSON.stringify(profile));
    console.log(`[Cache] SET - User profile: ${userId} (TTL: ${USER_PROFILE_TTL}s)`);
  } catch (error) {
    console.error('[Cache] Error setting user profile:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Call after any profile update
 * 
 * @param {string} userId - User ID
 */
export async function invalidateUserCache(userId) {
  try {
    const key = `${USER_PROFILE_PREFIX}${userId}`;
    const result = await redis.del(key);

    if (result === 1) {
      console.log(`[Cache] INVALIDATED - User profile: ${userId}`);
    } else {
      console.log(`[Cache] No cache to invalidate for user: ${userId}`);
    }
  } catch (error) {
    console.error('[Cache] Error invalidating user profile:', error);
  }
}

/**
 * Refresh token storage
 */
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
const REFRESH_TOKEN_PREFIX = 'refresh:';

/**
 * Store refresh token in Redis
 */
export async function storeRefreshToken(userId, tokenId, tokenData) {
  try {
    const key = `${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`;
    await redis.setex(key, REFRESH_TOKEN_TTL, JSON.stringify(tokenData));
    console.log(`[Cache] Stored refresh token for user: ${userId}`);
  } catch (error) {
    console.error('[Cache] Error storing refresh token:', error);
    throw error;
  }
}

/**
 * Get refresh token from Redis
 */
export async function getRefreshToken(userId, tokenId) {
  try {
    const key = `${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`;
    const token = await redis.get(key);

    if (token) {
      console.log(`[Cache] Found refresh token for user: ${userId}`);
      return JSON.parse(token);
    }

    return null;
  } catch (error) {
    console.error('[Cache] Error getting refresh token:', error);
    return null;
  }
}

/**
 * Ensures token is actually deleted
 */
export async function deleteRefreshToken(userId, tokenId) {
  try {
    const key = `${REFRESH_TOKEN_PREFIX}${userId}:${tokenId}`;
    const result = await redis.del(key);

    if (result === 1) {
      console.log(`[Cache] Deleted refresh token for user: ${userId}`);
      return true;
    } else {
      console.log(`[Cache] No token found to delete for user: ${userId}`);
      return false;
    }
  } catch (error) {
    console.error('[Cache] Error deleting refresh token:', error);
    throw error;
  }
}

/**
 * Delete all refresh tokens for a user
 */
export async function deleteAllUserTokens(userId) {
  try {
    const pattern = `${REFRESH_TOKEN_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] Deleted ${keys.length} tokens for user: ${userId}`);
      return keys.length;
    }

    return 0;
  } catch (error) {
    console.error('[Cache] Error deleting all user tokens:', error);
    throw error;
  }
}