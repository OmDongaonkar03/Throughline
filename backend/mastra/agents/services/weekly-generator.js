import { startOfWeek, endOfWeek, formatDate } from "../../../lib/time.js";
import { buildCompleteToneProfile } from "../../../lib/tone-profile-builder.js";
import { retryWithBackoff, withTimeout } from "../../../lib/llm-retry.js";
import { getModelString } from "../../../lib/llm-config.js";
import {
  NotFoundError,
  LLMError,
  DatabaseError,
} from "../../../utils/errors.js";
import {
  saveGeneratedPostTokenUsage,
  calculateEstimatedCost,
} from "../../../lib/token-usage.js";
import { createWeeklyGeneratorAgent } from "../prompts/weekly-prompt.js";
import { parseWeeklyPostResponse } from "../parsers/weekly-parser.js";
import logger, { logError } from "../../../utils/logger.js";

export async function generateWeeklyPost(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const weekStart = startOfWeek(targetDate);
  const weekEnd = endOfWeek(targetDate);

  logger.info("Starting weekly post generation", {
    userId,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    isManual,
  });

  // Fetch daily posts
  let dailyPosts;
  try {
    dailyPosts = await prisma.generatedPost.findMany({
      where: {
        userId,
        type: "DAILY",
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        isLatest: true,
      },
      orderBy: {
        date: "asc",
      },
    });
  } catch (error) {
    logError("Failed to fetch daily posts for weekly generation", error, {
      userId,
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
    });
    throw new DatabaseError(`Failed to fetch daily posts: ${error.message}`);
  }

  if (dailyPosts.length === 0) {
    logger.warn("No daily posts found for weekly generation", {
      userId,
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
    });
    throw new NotFoundError("No daily posts found for this week");
  }

  logger.debug("Daily posts retrieved for weekly generation", {
    userId,
    dailyPostCount: dailyPosts.length,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
  });

  // Fetch tone profile
  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    logError("Failed to fetch tone profile for weekly generation", error, {
      userId,
    });
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  // Create agent with tone profile
  const completeTone = buildCompleteToneProfile(toneProfile);
  const agent = createWeeklyGeneratorAgent(completeTone);

  // Format daily narratives
  const dailyNarratives = dailyPosts
    .map((post) => {
      const dayName = new Date(post.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      const themes = post.metadata?.themes?.join(", ") || "None";
      const insights = post.metadata?.insights?.join(", ") || "None";
      return `${dayName}:
${post.content}
[Day Themes: ${themes}]
[Day Insights: ${insights}]`;
    })
    .join("\n\n---\n\n");

  // Generate prompt
  const prompt = `Synthesize these daily narratives into a weekly reflection in the user's authentic voice.

WEEK OF: ${formatDate(weekStart)} to ${formatDate(weekEnd)}

DAILY NARRATIVES:
${dailyNarratives}

Your task: Find the pattern or thread that connects these days. Show what the week was really about. Write it exactly as the user would write it - same style, same voice. Don't list day by day; reveal the bigger picture.`;

  // Generate content
  try {
    logger.debug("Sending prompt to LLM for weekly generation", {
      userId,
      dailyPostCount: dailyPosts.length,
      modelUsed: getModelString(),
    });

    const response = await retryWithBackoff(async () => {
      return await withTimeout(agent.generate(prompt), 60000);
    });

    logger.debug("LLM response received for weekly generation", {
      userId,
      tokenUsage: response.usage,
    });

    // Parse response
    const parsed = parseWeeklyPostResponse(response.text);

    const metadata = {
      themes: parsed.themes,
      highlights: parsed.highlights,
      patterns: parsed.patterns,
      evolution: parsed.evolution,
      daysCovered: dailyPosts.length,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    // Save to database
    let generatedPost;
    try {
      generatedPost = await prisma.$transaction(async (tx) => {
        // Mark existing posts as not latest
        await tx.generatedPost.updateMany({
          where: {
            userId,
            type: "WEEKLY",
            date: weekStart,
            isLatest: true,
          },
          data: {
            isLatest: false,
          },
        });

        // Count previous versions
        const previousVersions = await tx.generatedPost.count({
          where: {
            userId,
            type: "WEEKLY",
            date: weekStart,
          },
        });

        // Create new post
        return await tx.generatedPost.create({
          data: {
            userId,
            type: "WEEKLY",
            date: weekStart,
            content: parsed.narrative,
            metadata,
            toneProfileId: toneProfile?.id,
            version: previousVersions + 1,
            isLatest: true,
            generationType: isManual ? "MANUAL" : "AUTO",
            modelUsed: getModelString(),
          },
        });
      });
    } catch (error) {
      logError("Failed to save generated weekly post", error, {
        userId,
        weekStart: formatDate(weekStart),
      });
      throw new DatabaseError(
        `Failed to save generated post: ${error.message}`,
      );
    }

    // Save token usage
    const modelUsed = getModelString();
    const estimatedCost = calculateEstimatedCost(response.usage, modelUsed);

    saveGeneratedPostTokenUsage(prisma, {
      generatedPostId: generatedPost.id,
      usage: response.usage,
      modelUsed,
      agentType: "weekly-generator",
      estimatedCost,
    });

    logger.info("Weekly post generated successfully", {
      userId,
      postId: generatedPost.id,
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
      version: generatedPost.version,
      generationType: generatedPost.generationType,
      daysCovered: dailyPosts.length,
      tokenUsage: response.usage,
      estimatedCost,
    });

    return generatedPost;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logError("Weekly generation error", error, {
      userId,
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
      dailyPostCount: dailyPosts.length,
    });
    throw new LLMError(`Failed to generate weekly post: ${error.message}`);
  }
}

export async function getOrGenerateWeeklyPost(userId, targetDate, prisma) {
  const weekStart = startOfWeek(targetDate);

  let existingPost;
  try {
    existingPost = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: "WEEKLY",
        date: weekStart,
        isLatest: true,
      },
    });
  } catch (error) {
    logError("Failed to check for existing weekly post", error, {
      userId,
      weekStart: formatDate(weekStart),
    });
    throw new DatabaseError(
      `Failed to check for existing post: ${error.message}`,
    );
  }

  if (existingPost) {
    logger.debug("Existing weekly post found, skipping generation", {
      userId,
      postId: existingPost.id,
      weekStart: formatDate(weekStart),
    });
    return existingPost;
  }

  logger.debug("No existing weekly post found, generating new", {
    userId,
    weekStart: formatDate(weekStart),
  });

  return await generateWeeklyPost(userId, targetDate, prisma, false);
}
