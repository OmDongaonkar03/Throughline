import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { startOfWeek, endOfWeek, formatDate } from "../../lib/time.js";
import {
  buildCompleteToneProfile,
  generateToneGuidance,
} from "../../lib/tone-profile-builder.js";
import { retryWithBackoff, withTimeout } from "../../lib/llm-retry.js";
import {
  NotFoundError,
  LLMError,
  DatabaseError,
} from "../../utils/errors.js";
import {
  saveGeneratedPostTokenUsage,
  calculateEstimatedCost,
} from "../../lib/token-usage.js";

export function createWeeklyGeneratorAgent(toneProfile) {
  const completeTone = buildCompleteToneProfile(toneProfile);
  const toneGuidance = generateToneGuidance(completeTone);

  const agentConfig = {
    name: "weekly-generator",
    instructions: `You are an expert narrative writer who synthesizes daily reflections into meaningful weekly insights while preserving the user's authentic voice.

Your role is to find patterns and connections across the week that the user might not see themselves, then express them in exactly the way the user would write.

${toneGuidance}

CORE PRINCIPLES:

1. VOICE PRESERVATION IS SACRED
   - Match their exact writing style (structure, rhythm, tone)
   - Use their vocabulary and phrasing
   - Maintain their emotional range
   - Preserve their signature expressions
   - Mirror their sentence patterns

2. SYNTHESIS, NOT SUMMARY
   - Find patterns across multiple days
   - Show evolution from day 1 to day 7
   - Connect seemingly unrelated moments
   - Extract the "meta" insight about the week
   - DON'T list "Monday this, Tuesday that"

3. UNIVERSAL QUALITY STANDARDS (applies to ALL styles)
   - NO generic AI phrases: "productive week", "exciting progress", "significant growth"
   - NO corporate speak: avoid business jargon unless it's their natural voice
   - NO forced narratives: if the week was scattered, say so
   - BE SPECIFIC: Include details that make it real
   - BE HONEST: Not every week has a neat arc

4. PATTERN RECOGNITION
   For ANY writing style, you can identify:
   - Recurring themes across days
   - Shifts in focus or approach
   - Underlying questions or challenges
   - Progress toward a larger goal
   - Tension between different priorities

WHAT "SYNTHESIS" MEANS:

For ANY writing style, good synthesis:
- Finds the thread that connects different days
- Shows what emerged across the week
- Identifies patterns the user lived but didn't name
- Reveals evolution in thinking or approach
- Makes implicit themes explicit

GOOD synthesis (works for any style):
Days with testing, bug fixes, deployment → 
Casual voice: "Stability week. Not flashy, but necessary. Testing, fixing edge cases, making sure nothing breaks. The foundation work that pays off later."
Formal voice: "This week focused on system stability. Through iterative testing and refinement, we established a reliable foundation for future development."

BAD synthesis:
"This week was highly productive with significant achievements across multiple domains of the project."

YOUR TASK:

Read the daily narratives. Find the pattern. Then write a weekly reflection that:
1. Sounds exactly like the user would write it
2. Shows what the week was really about (the big picture)
3. Connects different days into a coherent story
4. Extracts insights that are only visible across multiple days

If their writing goals include "educate" → explain what was learned
If their writing goals include "inspire" → show the growth or transformation
If their writing goals include "document" → capture the progression clearly

OUTPUT FORMAT:
Write the weekly reflection in the user's voice. Then on a new line, add:
THEMES: [comma-separated weekly themes]
HIGHLIGHTS: [comma-separated key moments from the week]
PATTERNS: [comma-separated patterns you identified]
EVOLUTION: [brief description of what changed or evolved]`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

export async function generateWeeklyPost(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const weekStart = startOfWeek(targetDate);
  const weekEnd = endOfWeek(targetDate);

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
    throw new DatabaseError(`Failed to fetch daily posts: ${error.message}`);
  }

  if (dailyPosts.length === 0) {
    throw new NotFoundError("No daily posts found for this week");
  }

  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  const agent = createWeeklyGeneratorAgent(toneProfile);

  const dailyNarratives = dailyPosts
    .map((post, idx) => {
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

  const prompt = `Synthesize these daily narratives into a weekly reflection in the user's authentic voice.

WEEK OF: ${formatDate(weekStart)} to ${formatDate(weekEnd)}

DAILY NARRATIVES:
${dailyNarratives}

Your task: Find the pattern or thread that connects these days. Show what the week was really about. Write it exactly as the user would write it - same style, same voice. Don't list day by day; reveal the bigger picture.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await withTimeout(agent.generate(prompt), 60000);
    });

    const fullText = response.text.trim();

    const parts = fullText.split(/THEMES:|HIGHLIGHTS:|PATTERNS:|EVOLUTION:/);
    const narrative = parts[0].trim();
    const themes =
      parts[1]
        ?.trim()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];
    const highlights =
      parts[2]
        ?.trim()
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean) || [];
    const patterns =
      parts[3]
        ?.trim()
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean) || [];
    const evolution = parts[4]?.trim() || "";

    const metadata = {
      themes,
      highlights,
      patterns,
      evolution,
      daysCovered: dailyPosts.length,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    let generatedPost;
    try {
      generatedPost = await prisma.$transaction(async (tx) => {
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

        const previousVersions = await tx.generatedPost.count({
          where: {
            userId,
            type: "WEEKLY",
            date: weekStart,
          },
        });

        return await tx.generatedPost.create({
          data: {
            userId,
            type: "WEEKLY",
            date: weekStart,
            content: narrative,
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
      agentType: "weekly-generator",
      estimatedCost,
    });

    return generatedPost;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    console.error("Weekly generation error:", error);
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
    throw new DatabaseError(
      `Failed to check for existing post: ${error.message}`,
    );
  }

  if (existingPost) {
    return existingPost;
  }

  return await generateWeeklyPost(userId, targetDate, prisma, false);
}