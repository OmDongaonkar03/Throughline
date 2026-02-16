import { startOfDay, endOfDay, formatDate } from "../../../lib/time.js";
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
import { createDailyGeneratorAgent } from "../prompts/daily-prompt.js";
import { parseDailyPostResponse } from "../parsers/daily-parser.js";
import logger, { logError } from "../../../utils/logger.js";

export async function generateDailyPost(userId, targetDate, isManual = false) {
  const startDate = startOfDay(targetDate);
  const endDate = endOfDay(targetDate);

  logger.info("Starting daily post generation", {
    userId,
    targetDate: formatDate(targetDate),
    isManual,
  });

  // Fetch check-ins
  let checkIns;
  try {
    checkIns = await prisma.checkIn.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    logError("Failed to fetch check-ins for daily generation", error, {
      userId,
      targetDate: formatDate(targetDate),
    });
    throw new DatabaseError(`Failed to fetch check-ins: ${error.message}`);
  }

  if (checkIns.length === 0) {
    logger.warn("No check-ins found for daily generation", {
      userId,
      targetDate: formatDate(targetDate),
    });
    throw new NotFoundError("No check-ins found for this date");
  }

  logger.debug("Check-ins retrieved for daily generation", {
    userId,
    checkInCount: checkIns.length,
    targetDate: formatDate(targetDate),
  });

  // Fetch tone profile
  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    logError("Failed to fetch tone profile for daily generation", error, {
      userId,
    });
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  // Create agent with tone profile
  const completeTone = buildCompleteToneProfile(toneProfile);
  const agent = createDailyGeneratorAgent(completeTone);

  // Format check-ins
  const checkInsText = checkIns
    .map((c) => {
      const time = new Date(c.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `[${time}] ${c.content}`;
    })
    .join("\n");

  // Generate prompt
  const prompt = `Transform these raw check-ins into a polished narrative that sounds like the user would write it.

DATE: ${formatDate(targetDate)}

RAW CHECK-INS:
${checkInsText}

Your task: 
1. Read these chronologically - understand the rhythm and flow of their day
2. Find the connecting thread: What's the story here? How does one moment lead to the next?
3. Write it as a flowing narrative in their voice - not a list of activities
4. Use natural transitions and let thoughts connect organically
5. Preserve their authenticity while making the progression feel smooth and intentional
6. Extract any underlying patterns or insights if present`;

  // Generate content
  try {
    logger.debug("Sending prompt to LLM for daily generation", {
      userId,
      checkInCount: checkIns.length,
      modelUsed: getModelString(),
    });

    const response = await retryWithBackoff(async () => {
      return await withTimeout(agent.generate(prompt), 60000);
    });

    logger.debug("LLM response received for daily generation", {
      userId,
      tokenUsage: response.usage,
    });

    // Parse response
    const parsed = parseDailyPostResponse(response.text);

    const metadata = {
      themes: parsed.themes,
      highlights: parsed.highlights,
      insights: parsed.insights,
      checkInCount: checkIns.length,
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
            type: "DAILY",
            date: startDate,
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
            type: "DAILY",
            date: startDate,
          },
        });

        // Create new post
        return await tx.generatedPost.create({
          data: {
            userId,
            type: "DAILY",
            date: startDate,
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
      logError("Failed to save generated daily post", error, {
        userId,
        targetDate: formatDate(targetDate),
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
      agentType: "daily-generator",
      estimatedCost,
    });

    logger.info("Daily post generated successfully", {
      userId,
      postId: generatedPost.id,
      targetDate: formatDate(targetDate),
      version: generatedPost.version,
      generationType: generatedPost.generationType,
      checkInCount: checkIns.length,
      tokenUsage: response.usage,
      estimatedCost,
    });

    return generatedPost;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logError("Daily generation error", error, {
      userId,
      targetDate: formatDate(targetDate),
      checkInCount: checkIns.length,
    });
    throw new LLMError(`Failed to generate daily post: ${error.message}`);
  }
}

export async function getOrGenerateDailyPost(userId, targetDate, prisma) {
  const startDate = startOfDay(targetDate);

  let existingPost;
  try {
    existingPost = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: "DAILY",
        date: startDate,
        isLatest: true,
      },
    });
  } catch (error) {
    logError("Failed to check for existing daily post", error, {
      userId,
      targetDate: formatDate(targetDate),
    });
    throw new DatabaseError(
      `Failed to check for existing post: ${error.message}`,
    );
  }

  if (existingPost) {
    logger.debug("Existing daily post found, skipping generation", {
      userId,
      postId: existingPost.id,
      targetDate: formatDate(targetDate),
    });
    return existingPost;
  }

  logger.debug("No existing daily post found, generating new", {
    userId,
    targetDate: formatDate(targetDate),
  });

  return await generateDailyPost(userId, targetDate, prisma, false);
}
