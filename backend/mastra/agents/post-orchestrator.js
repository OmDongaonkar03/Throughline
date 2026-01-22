import { generateDailyPost } from "./daily-generator.js";
import { generateWeeklyPost } from "./weekly-generator.js";
import { generateMonthlyPost } from "./monthly-generator.js";
import { adaptForPlatform } from "./platform-adapter.js";
import { getEnabledPlatforms } from "../../lib/platform-specs.js";
import {
  NotFoundError,
  AuthorizationError,
  ValidationError,
  DatabaseError,
} from "../../utils/errors.js";
import {
  savePlatformPostTokenUsage,
  calculateEstimatedCost,
} from "../../lib/token-usage.js";
import { getModelString } from "../../lib/llm-config.js";

export async function generatePlatformPosts(basePost, userId, prisma) {
  let platformSettings;
  try {
    platformSettings = await prisma.userPlatformSettings.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(
      `Failed to fetch platform settings: ${error.message}`,
    );
  }

  if (!platformSettings) {
    throw new NotFoundError("User platform settings not found");
  }

  const platforms = getEnabledPlatforms(platformSettings);

  if (platforms.length === 0) {
    throw new ValidationError("No platforms enabled");
  }

  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  const platformPosts = [];
  const errors = [];

  for (const platform of platforms) {
    try {
      const adaptedPost = await adaptForPlatform(
        basePost.content,
        basePost.metadata,
        platform,
        toneProfile,
      );

      const platformPost = await prisma.platformPost.create({
        data: {
          postId: basePost.id,
          platform,
          content: adaptedPost.content,
          hashtags: adaptedPost.hashtags,
        },
      });

      // Save token usage for this platform adaptation (non-blocking)
      if (adaptedPost.usage) {
        const modelUsed = getModelString();
        const estimatedCost = calculateEstimatedCost(adaptedPost.usage, modelUsed);

        savePlatformPostTokenUsage(prisma, {
          platformPostId: platformPost.id,
          usage: adaptedPost.usage,
          modelUsed,
          platform: platform.toUpperCase(),
          estimatedCost,
        });
      }

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
  isManual = false,
) {
  const basePost = await generateDailyPost(
    userId,
    targetDate,
    prisma,
    isManual,
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
  isManual = false,
) {
  const basePost = await generateWeeklyPost(
    userId,
    targetDate,
    prisma,
    isManual,
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
  isManual = false,
) {
  const basePost = await generateMonthlyPost(
    userId,
    targetDate,
    prisma,
    isManual,
  );

  const platformResult = await generatePlatformPosts(basePost, userId, prisma);

  return {
    basePost,
    ...platformResult,
  };
}

async function generateNewPlatformPosts(basePost, userId, prisma) {
  let platformSettings;
  try {
    platformSettings = await prisma.userPlatformSettings.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(
      `Failed to fetch platform settings: ${error.message}`,
    );
  }

  if (!platformSettings) {
    throw new NotFoundError("User platform settings not found");
  }

  const platforms = getEnabledPlatforms(platformSettings);

  if (platforms.length === 0) {
    throw new ValidationError("No platforms enabled");
  }

  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  const platformPosts = [];
  const errors = [];

  for (const platform of platforms) {
    try {
      const adaptedPost = await adaptForPlatform(
        basePost.content,
        basePost.metadata,
        platform,
        toneProfile,
      );

      platformPosts.push({
        platform: adaptedPost.platform,
        content: adaptedPost.content,
        hashtags: adaptedPost.hashtags,
        usage: adaptedPost.usage, // Include usage for saving later
      });
    } catch (error) {
      console.error(`Failed to generate ${platform} post:`, error);
      errors.push({ platform, error: error.message });
    }
  }

  if (platformPosts.length === 0) {
    throw new ValidationError("Failed to generate any platform posts");
  }

  return { platformPosts, errors };
}

export async function regeneratePlatformPosts(basePostId, userId, prisma) {
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

  const { platformPosts: newPosts, errors } = await generateNewPlatformPosts(
    basePost,
    userId,
    prisma,
  );

  let savedPosts;
  try {
    savedPosts = await prisma.$transaction(async (tx) => {
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

        // Save token usage for this platform adaptation
        if (post.usage) {
          const modelUsed = getModelString();
          const estimatedCost = calculateEstimatedCost(post.usage, modelUsed);

          savePlatformPostTokenUsage(prisma, {
            platformPostId: platformPost.id,
            usage: post.usage,
            modelUsed,
            platform: post.platform.toUpperCase(),
            estimatedCost,
          });
        }

        created.push(platformPost);
      }

      return created;
    });
  } catch (error) {
    throw new DatabaseError(`Failed to save platform posts: ${error.message}`);
  }

  return {
    success: true,
    platformPosts: savedPosts,
    generated: savedPosts.length,
    failed: errors.length,
    errors,
  };
}

export async function getPostsWithPlatforms(userId, type, targetDate, prisma) {
  let basePost;
  try {
    basePost = await prisma.generatedPost.findFirst({
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
  } catch (error) {
    throw new DatabaseError(`Failed to fetch posts: ${error.message}`);
  }

  return basePost;
}

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