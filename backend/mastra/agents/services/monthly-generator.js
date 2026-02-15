import { startOfMonth, endOfMonth } from "../../../lib/time.js";
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
import { createMonthlyGeneratorAgent } from "../prompts/monthly-prompt.js";
import { parseMonthlyPostResponse } from "../parsers/monthly-parser.js";

export async function generateMonthlyPost(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  // Fetch weekly posts
  let weeklyPosts;
  try {
    weeklyPosts = await prisma.generatedPost.findMany({
      where: {
        userId,
        type: "WEEKLY",
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isLatest: true,
      },
      orderBy: {
        date: "asc",
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch weekly posts: ${error.message}`);
  }

  if (weeklyPosts.length === 0) {
    throw new NotFoundError("No weekly posts found for this month");
  }

  // Fetch tone profile
  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  // Create agent with tone profile
  const completeTone = buildCompleteToneProfile(toneProfile);
  const agent = createMonthlyGeneratorAgent(completeTone);

  // Format weekly narratives
  const weeklyNarratives = weeklyPosts
    .map((post, idx) => {
      const weekNum = idx + 1;
      const weekStart = new Date(post.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const themes = post.metadata?.themes?.join(", ") || "None";
      const patterns = post.metadata?.patterns?.join(", ") || "None";
      const evolution = post.metadata?.evolution || "None";
      return `Week ${weekNum} (${weekStart}):
${post.content}
[Themes: ${themes}]
[Patterns: ${patterns}]
[Evolution: ${evolution}]`;
    })
    .join("\n\n---\n\n");

  const monthName = new Date(monthStart).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Generate prompt
  const prompt = `Synthesize these weekly narratives into a monthly reflection in the user's authentic voice.

MONTH: ${monthName}

WEEKLY NARRATIVES:
${weeklyNarratives}

Your task: Show the arc of this month. What was it fundamentally about? How did things progress from week 1 to week ${weeklyPosts.length}? What foundation was built? What does this enable going forward? Write it exactly as the user would - same style, same voice.`;

  // Generate content
  try {
    const response = await retryWithBackoff(async () => {
      return await withTimeout(agent.generate(prompt), 60000);
    });

    // Parse response
    const parsed = parseMonthlyPostResponse(response.text);

    const metadata = {
      themes: parsed.themes,
      achievements: parsed.achievements,
      shifts: parsed.shifts,
      momentum: parsed.momentum,
      nextFocus: parsed.nextFocus,
      weeksCovered: weeklyPosts.length,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
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
            type: "MONTHLY",
            date: monthStart,
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
            type: "MONTHLY",
            date: monthStart,
          },
        });

        // Create new post
        return await tx.generatedPost.create({
          data: {
            userId,
            type: "MONTHLY",
            date: monthStart,
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
      agentType: "monthly-generator",
      estimatedCost,
    });

    return generatedPost;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    console.error("Monthly generation error:", error);
    throw new LLMError(`Failed to generate monthly post: ${error.message}`);
  }
}

export async function getOrGenerateMonthlyPost(userId, targetDate, prisma) {
  const monthStart = startOfMonth(targetDate);

  let existingPost;
  try {
    existingPost = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: "MONTHLY",
        date: monthStart,
        isLatest: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(
      `Failed to check for existing post: ${error.message}`,
    );
  }

  if (existingPost) {
    return existingPost;
  }

  return await generateMonthlyPost(userId, targetDate, prisma, false);
}