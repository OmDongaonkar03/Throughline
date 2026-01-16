import { generateDailyPost } from "./daily-generator.js";
import { generateWeeklyPost } from "./weekly-generator.js";
import { generateMonthlyPost } from "./monthly-generator.js";
import { adaptForPlatform } from "./platform-adapter.js";
import { getEnabledPlatforms } from "../../lib/platform-specs.js";

/**
 * Generate posts for all enabled platforms
 * This is the main entry point for post generation
 * Platforms are always determined from user settings
 */
export async function generatePlatformPosts(basePost, userId, prisma) {
  // 1. Get user's platform settings
  const platformSettings = await prisma.userPlatformSettings.findUnique({
    where: { userId },
  });

  if (!platformSettings) {
    throw new Error("User platform settings not found");
  }

  // 2. Get enabled platforms from user settings
  const platforms = getEnabledPlatforms(platformSettings);

  if (platforms.length === 0) {
    throw new Error("No platforms enabled");
  }

  // 3. Get user's tone profile
  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  // 4. Generate platform-specific posts
  const platformPosts = [];
  const errors = [];

  for (const platform of platforms) {
    try {
      const adaptedPost = await adaptForPlatform(
        basePost.content,
        basePost.metadata,
        platform,
        toneProfile
      );

      // Save platform post
      const platformPost = await prisma.platformPost.create({
        data: {
          postId: basePost.id,
          platform,
          content: adaptedPost.content,
          hashtags: adaptedPost.hashtags,
        },
      });

      platformPosts.push(platformPost);
    } catch (error) {
      console.error(`Failed to generate ${platform} post:`, error);
      errors.push({ platform, error: error.message });
    }
  }

  // 5. Return results
  return {
    success: platformPosts.length > 0,
    platformPosts,
    errors,
    generated: platformPosts.length,
    failed: errors.length,
  };
}

/**
 * Generate complete daily posts (base + all enabled platforms)
 */
export async function generateCompleteDailyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  // 1. Generate base narrative
  const basePost = await generateDailyPost(
    userId,
    targetDate,
    prisma,
    isManual
  );

  // 2. Generate platform-specific posts for all enabled platforms
  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

/**
 * Generate complete weekly posts (base + all enabled platforms)
 */
export async function generateCompleteWeeklyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  // 1. Generate base narrative
  const basePost = await generateWeeklyPost(
    userId,
    targetDate,
    prisma,
    isManual
  );

  // 2. Generate platform-specific posts for all enabled platforms
  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

/**
 * Generate complete monthly posts (base + all enabled platforms)
 */
export async function generateCompleteMonthlyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  // 1. Generate base narrative
  const basePost = await generateMonthlyPost(
    userId,
    targetDate,
    prisma,
    isManual
  );

  // 2. Generate platform-specific posts for all enabled platforms
  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

/**
 * Regenerate platform posts for an existing base post
 * Always regenerates for ALL currently enabled platforms
 */
export async function regeneratePlatformPosts(basePostId, userId, prisma) {
  // 1. Get the base post
  const basePost = await prisma.generatedPost.findUnique({
    where: { id: basePostId },
  });

  if (!basePost) {
    throw new Error("Base post not found");
  }

  if (basePost.userId !== userId) {
    throw new Error("Unauthorized: Post belongs to different user");
  }

  // 2. Delete old platform posts
  await prisma.platformPost.deleteMany({
    where: {
      postId: basePostId,
    },
  });

  // 3. Generate new platform posts for all currently enabled platforms
  return await generatePlatformPosts(basePost, userId, prisma);
}

/**
 * Get posts for display (base + platform posts)
 */
export async function getPostsWithPlatforms(userId, type, targetDate, prisma) {
  const basePost = await prisma.generatedPost.findFirst({
    where: {
      userId,
      type,
      date: targetDate,
      isLatest: true,
    },
    include: {
      platformPosts: true,
    },
  });

  return basePost;
}

/**
 * Check regeneration limits
 * Returns true if user can regenerate, false if limit exceeded
 */
export async function canUserRegenerate(userId, prisma) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const regenerationCount = await prisma.generatedPost.count({
    where: {
      userId,
      generationType: "MANUAL",
      createdAt: {
        gte: today,
      },
    },
  });

  const DAILY_LIMIT = 3;
  return regenerationCount < DAILY_LIMIT;
}

/**
 * Get regeneration count for today
 */
export async function getRegenerationCount(userId, prisma) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.generatedPost.count({
    where: {
      userId,
      generationType: "MANUAL",
      createdAt: {
        gte: today,
      },
    },
  });

  return {
    used: count,
    limit: 3,
    remaining: Math.max(0, 3 - count),
  };
}