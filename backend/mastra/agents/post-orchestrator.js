import { generateDailyPost } from "./daily-generator.js";
import { generateWeeklyPost } from "./weekly-generator.js";
import { generateMonthlyPost } from "./monthly-generator.js";
import {
  NotFoundError,
  AuthorizationError,
  DatabaseError,
} from "../../utils/errors.js";

/**
 * Generate complete daily post (base narrative only)
 */
export async function generateCompleteDailyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const basePost = await generateDailyPost(
    userId,
    targetDate,
    prisma,
    isManual,
  );

  return {
    basePost,
    generated: 1,
    failed: 0,
    errors: [],
  };
}

/**
 * Generate complete weekly post (base narrative only)
 */
export async function generateCompleteWeeklyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const basePost = await generateWeeklyPost(
    userId,
    targetDate,
    prisma,
    isManual,
  );

  return {
    basePost,
    generated: 1,
    failed: 0,
    errors: [],
  };
}

/**
 * Generate complete monthly post (base narrative only)
 */
export async function generateCompleteMonthlyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const basePost = await generateMonthlyPost(
    userId,
    targetDate,
    prisma,
    isManual,
  );

  return {
    basePost,
    generated: 1,
    failed: 0,
    errors: [],
  };
}

/**
 * Regenerate a base post (create new version)
 */
export async function regeneratePost(basePostId, userId, prisma) {
  let basePost;
  try {
    basePost = await prisma.generatedPost.findUnique({
      where: { id: basePostId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch base post: ${error.message}`);
  }

  if (!basePost) {
    throw new NotFoundError("Base post not found");
  }

  if (basePost.userId !== userId) {
    throw new AuthorizationError(
      "Unauthorized: Post belongs to different user",
    );
  }

  // Regenerate based on type
  let newPost;
  switch (basePost.type) {
    case "DAILY":
      newPost = await generateDailyPost(userId, basePost.date, prisma, true);
      break;
    case "WEEKLY":
      newPost = await generateWeeklyPost(userId, basePost.date, prisma, true);
      break;
    case "MONTHLY":
      newPost = await generateMonthlyPost(userId, basePost.date, prisma, true);
      break;
    default:
      throw new ValidationError(`Unsupported post type: ${basePost.type}`);
  }

  return {
    success: true,
    basePost: newPost,
    generated: 1,
    failed: 0,
    errors: [],
  };
}

/**
 * Get post with all versions
 */
export async function getPostWithVersions(userId, type, targetDate, prisma) {
  let posts;
  try {
    posts = await prisma.generatedPost.findMany({
      where: {
        userId,
        type,
        date: targetDate,
      },
      orderBy: {
        version: 'desc',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch posts: ${error.message}`);
  }

  return posts;
}

/**
 * Check if user can regenerate (rate limit)
 */
export async function canUserRegenerate(userId, prisma) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let regenerationCount;
  try {
    regenerationCount = await prisma.generatedPost.count({
      where: {
        userId,
        generationType: "MANUAL",
        createdAt: {
          gte: today,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(
      `Failed to check regeneration count: ${error.message}`,
    );
  }

  const DAILY_LIMIT = 3;
  return regenerationCount < DAILY_LIMIT;
}

/**
 * Get regeneration count stats
 */
export async function getRegenerationCount(userId, prisma) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count;
  try {
    count = await prisma.generatedPost.count({
      where: {
        userId,
        generationType: "MANUAL",
        createdAt: {
          gte: today,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(
      `Failed to get regeneration count: ${error.message}`,
    );
  }

  return {
    used: count,
    limit: 3,
    remaining: Math.max(0, 3 - count),
  };
}