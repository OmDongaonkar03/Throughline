import { generateDailyPost } from "./daily-generator.js";
import { generateWeeklyPost } from "./weekly-generator.js";
import { generateMonthlyPost } from "./monthly-generator.js";
import { adaptForPlatform } from "./platform-adapter.js";
import { getEnabledPlatforms } from "../../lib/platform-specs.js";

export async function generatePlatformPosts(basePost, userId, prisma) {
  const platformSettings = await prisma.userPlatformSettings.findUnique({
    where: { userId },
  });

  if (!platformSettings) {
    throw new Error("User platform settings not found");
  }

  const platforms = getEnabledPlatforms(platformSettings);

  if (platforms.length === 0) {
    throw new Error("No platforms enabled");
  }

  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

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

  return {
    success: platformPosts.length > 0,
    platformPosts,
    errors,
    generated: platformPosts.length,
    failed: errors.length,
  };
}

export async function generateCompleteDailyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  const basePost = await generateDailyPost(
    userId,
    targetDate,
    prisma,
    isManual
  );

  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

export async function generateCompleteWeeklyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  const basePost = await generateWeeklyPost(
    userId,
    targetDate,
    prisma,
    isManual
  );

  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

export async function generateCompleteMonthlyPosts(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  const basePost = await generateMonthlyPost(
    userId,
    targetDate,
    prisma,
    isManual
  );

  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

async function generateNewPlatformPosts(basePost, userId, prisma) {
  const platformSettings = await prisma.userPlatformSettings.findUnique({
    where: { userId },
  });

  if (!platformSettings) {
    throw new Error("User platform settings not found");
  }

  const platforms = getEnabledPlatforms(platformSettings);
  
  if (platforms.length === 0) {
    throw new Error("No platforms enabled");
  }

  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

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

      platformPosts.push({
        platform: adaptedPost.platform,
        content: adaptedPost.content,
        hashtags: adaptedPost.hashtags,
      });
    } catch (error) {
      console.error(`Failed to generate ${platform} post:`, error);
      errors.push({ platform, error: error.message });
    }
  }

  if (platformPosts.length === 0) {
    throw new Error("Failed to generate any platform posts");
  }

  return { platformPosts, errors };
}

export async function regeneratePlatformPosts(basePostId, userId, prisma) {
  const basePost = await prisma.generatedPost.findUnique({
    where: { id: basePostId },
  });

  if (!basePost) {
    throw new Error("Base post not found");
  }

  if (basePost.userId !== userId) {
    throw new Error("Unauthorized: Post belongs to different user");
  }

  const { platformPosts: newPosts, errors } = await generateNewPlatformPosts(
    basePost,
    userId,
    prisma
  );

  const savedPosts = await prisma.$transaction(async (tx) => {
    await tx.platformPost.deleteMany({
      where: { postId: basePostId },
    });

    const created = [];
    for (const post of newPosts) {
      const platformPost = await tx.platformPost.create({
        data: {
          postId: basePostId,
          platform: post.platform,
          content: post.content,
          hashtags: post.hashtags,
        },
      });
      created.push(platformPost);
    }

    return created;
  });

  return {
    success: true,
    platformPosts: savedPosts,
    generated: savedPosts.length,
    failed: errors.length,
    errors,
  };
}

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