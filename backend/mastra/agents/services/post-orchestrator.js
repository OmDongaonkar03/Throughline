import { generateDailyPost } from "./daily-generator.js";
import { generateWeeklyPost } from "./weekly-generator.js";
import { generateMonthlyPost } from "./monthly-generator.js";
import {
  NotFoundError,
  AuthorizationError,
  DatabaseError,
  ValidationError,
} from "../../../utils/errors.js";
import logger, { logUserAction, logError } from "../../../utils/logger.js";

/**
 * Generate complete daily post (base narrative only)
 */
export async function generateCompleteDailyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  logger.info("Starting complete daily post generation", {
    userId,
    targetDate: targetDate.toISOString().split("T")[0],
    isManual,
  });

  try {
    const basePost = await generateDailyPost(
      userId,
      targetDate,
      prisma,
      isManual,
    );

    if (isManual) {
      logUserAction("daily_post_generated", userId, {
        postId: basePost.id,
        targetDate: targetDate.toISOString().split("T")[0],
        version: basePost.version,
        generationType: "manual",
      });
    }

    return {
      basePost,
      generated: 1,
      failed: 0,
      errors: [],
    };
  } catch (error) {
    logError("Failed to generate complete daily posts", error, {
      userId,
      targetDate: targetDate.toISOString().split("T")[0],
      isManual,
    });
    throw error;
  }
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
  logger.info("Starting complete weekly post generation", {
    userId,
    targetDate: targetDate.toISOString().split("T")[0],
    isManual,
  });

  try {
    const basePost = await generateWeeklyPost(
      userId,
      targetDate,
      prisma,
      isManual,
    );

    if (isManual) {
      logUserAction("weekly_post_generated", userId, {
        postId: basePost.id,
        targetDate: targetDate.toISOString().split("T")[0],
        version: basePost.version,
        generationType: "manual",
      });
    }

    return {
      basePost,
      generated: 1,
      failed: 0,
      errors: [],
    };
  } catch (error) {
    logError("Failed to generate complete weekly posts", error, {
      userId,
      targetDate: targetDate.toISOString().split("T")[0],
      isManual,
    });
    throw error;
  }
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
  logger.info("Starting complete monthly post generation", {
    userId,
    targetDate: targetDate.toISOString().split("T")[0],
    isManual,
  });

  try {
    const basePost = await generateMonthlyPost(
      userId,
      targetDate,
      prisma,
      isManual,
    );

    if (isManual) {
      logUserAction("monthly_post_generated", userId, {
        postId: basePost.id,
        targetDate: targetDate.toISOString().split("T")[0],
        version: basePost.version,
        generationType: "manual",
      });
    }

    return {
      basePost,
      generated: 1,
      failed: 0,
      errors: [],
    };
  } catch (error) {
    logError("Failed to generate complete monthly posts", error, {
      userId,
      targetDate: targetDate.toISOString().split("T")[0],
      isManual,
    });
    throw error;
  }
}

/**
 * Regenerate a base post (create new version)
 */
export async function regeneratePost(basePostId, userId, prisma) {
  logger.info("Starting post regeneration", {
    userId,
    basePostId,
  });

  let basePost;
  try {
    basePost = await prisma.generatedPost.findUnique({
      where: { id: basePostId },
    });
  } catch (error) {
    logError("Failed to fetch base post for regeneration", error, {
      userId,
      basePostId,
    });
    throw new DatabaseError(`Failed to fetch base post: ${error.message}`);
  }

  if (!basePost) {
    logger.warn("Base post not found for regeneration", {
      userId,
      basePostId,
    });
    throw new NotFoundError("Base post not found");
  }

  if (basePost.userId !== userId) {
    logger.warn("Unauthorized regeneration attempt", {
      userId,
      basePostId,
      actualUserId: basePost.userId,
    });
    throw new AuthorizationError(
      "Unauthorized: Post belongs to different user",
    );
  }

  // Regenerate based on type
  let newPost;
  try {
    switch (basePost.type) {
      case "DAILY":
        newPost = await generateDailyPost(userId, basePost.date, prisma, true);
        break;
      case "WEEKLY":
        newPost = await generateWeeklyPost(userId, basePost.date, prisma, true);
        break;
      case "MONTHLY":
        newPost = await generateMonthlyPost(
          userId,
          basePost.date,
          prisma,
          true,
        );
        break;
      default:
        logger.warn("Unsupported post type for regeneration", {
          userId,
          basePostId,
          postType: basePost.type,
        });
        throw new ValidationError(`Unsupported post type: ${basePost.type}`);
    }

    logUserAction("post_regenerated", userId, {
      oldPostId: basePostId,
      newPostId: newPost.id,
      postType: basePost.type,
      newVersion: newPost.version,
      date: basePost.date.toISOString().split("T")[0],
    });

    logger.info("Post regenerated successfully", {
      userId,
      oldPostId: basePostId,
      newPostId: newPost.id,
      postType: basePost.type,
      newVersion: newPost.version,
    });

    return {
      success: true,
      basePost: newPost,
      generated: 1,
      failed: 0,
      errors: [],
    };
  } catch (error) {
    logError("Failed to regenerate post", error, {
      userId,
      basePostId,
      postType: basePost.type,
    });
    throw error;
  }
}

/**
 * Get post with all versions
 */
export async function getPostWithVersions(userId, type, targetDate, prisma) {
  logger.debug("Fetching post versions", {
    userId,
    type,
    targetDate: targetDate.toISOString().split("T")[0],
  });

  let posts;
  try {
    posts = await prisma.generatedPost.findMany({
      where: {
        userId,
        type,
        date: targetDate,
      },
      orderBy: {
        version: "desc",
      },
    });

    logger.debug("Post versions retrieved", {
      userId,
      type,
      targetDate: targetDate.toISOString().split("T")[0],
      versionCount: posts.length,
    });
  } catch (error) {
    logError("Failed to fetch post versions", error, {
      userId,
      type,
      targetDate: targetDate.toISOString().split("T")[0],
    });
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
    logError("Failed to check regeneration limit", error, { userId });
    throw new DatabaseError(
      `Failed to check regeneration count: ${error.message}`,
    );
  }

  const DAILY_LIMIT = 3;
  const canRegenerate = regenerationCount < DAILY_LIMIT;

  if (!canRegenerate) {
    logger.warn("User hit regeneration daily limit", {
      userId,
      regenerationCount,
      limit: DAILY_LIMIT,
    });
  }

  return canRegenerate;
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
    logError("Failed to get regeneration count", error, { userId });
    throw new DatabaseError(
      `Failed to get regeneration count: ${error.message}`,
    );
  }

  logger.debug("Regeneration count retrieved", {
    userId,
    used: count,
    limit: 3,
    remaining: Math.max(0, 3 - count),
  });

  return {
    used: count,
    limit: 3,
    remaining: Math.max(0, 3 - count),
  };
}
