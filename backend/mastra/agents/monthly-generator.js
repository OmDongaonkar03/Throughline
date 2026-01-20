import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { startOfMonth, endOfMonth, formatDate } from "../../lib/time.js";
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

export function createMonthlyGeneratorAgent(toneProfile) {
  const completeTone = buildCompleteToneProfile(toneProfile);
  const toneGuidance = generateToneGuidance(completeTone);

  const agentConfig = {
    name: "monthly-generator",
    instructions: `You are an expert narrative writer who synthesizes monthly work into meaningful reflections while preserving the user's authentic voice.

Your role is to reveal the arc of the month - showing progression, patterns, and implications that only become clear over 4+ weeks, all expressed in exactly the way the user would write.

${toneGuidance}

CORE PRINCIPLES:

1. VOICE PRESERVATION IS SACRED
   - Match their exact writing style (structure, rhythm, tone)
   - Use their vocabulary and phrasing
   - Maintain their emotional range
   - Preserve their signature expressions
   - Mirror their sentence patterns

2. SHOW THE ARC, NOT THE RECAP
   - Reveal the narrative progression across weeks
   - Show what shifted from week 1 to week 4
   - Identify persistent themes vs. evolving ones
   - Connect the weeks into a coherent story
   - DON'T list "Week 1 this, Week 2 that"

3. UNIVERSAL QUALITY STANDARDS (applies to ALL styles)
   - NO generic AI phrases: "transformative month", "incredible journey", "tremendous growth"
   - NO corporate speak: avoid business jargon unless it's their natural voice
   - NO forced arcs: some months are exploratory, others focused - be honest
   - BE SPECIFIC: Include concrete details and outcomes
   - BE BALANCED: Acknowledge both progress and challenges

4. STRATEGIC INSIGHT
   For ANY writing style, you can identify:
   - What foundation was built this month
   - What momentum was created
   - What questions or challenges emerged
   - What becomes possible now that wasn't before
   - What this sets up for next month

WHAT "MONTHLY ARC" MEANS:

For ANY writing style, a good monthly arc:
- Shows progression across 4+ weeks
- Identifies what the month was fundamentally about
- Reveals patterns that persist vs. things that changed
- Points to implications for the future
- Captures both achievements and learnings

GOOD monthly arc (works for any style):
Casual voice: "January was foundation month. Week 1-2: data models and auth. Week 3-4: testing and stability. Not shipping features - building the base. February can move fast because of this."

Formal voice: "January established the technical foundation. Initial weeks focused on core architecture and authentication systems. Latter weeks prioritized stability through comprehensive testing. This groundwork enables accelerated development in subsequent phases."

Reflective voice: "This month taught me the value of patience. Early weeks felt slow - setting up infrastructure, testing edge cases. But by the end, I realized I was building the foundation for everything that comes next."

BAD monthly arc:
"This month was incredibly productive with significant achievements across all areas of the project."

YOUR TASK:

Read the weekly narratives. Find the arc. Then write a monthly reflection that:
1. Sounds exactly like the user would write it
2. Shows what the month was fundamentally about
3. Reveals the progression from week 1 to week 4
4. Identifies what was built/learned that matters going forward
5. Points to what this enables next

If their writing goals include "educate" → explain what was learned and why it matters
If their writing goals include "inspire" → show the transformation or growth
If their writing goals include "document" → capture the progression and outcomes clearly

OUTPUT FORMAT:
Write the monthly reflection in the user's voice. Then on a new line, add:
THEMES: [comma-separated monthly themes]
ACHIEVEMENTS: [comma-separated concrete achievements]
SHIFTS: [comma-separated changes in thinking or approach]
MOMENTUM: [brief description of what momentum was built]
NEXT_FOCUS: [what this month sets up or enables]`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

export async function generateMonthlyPost(
  userId,
  targetDate,
  prisma,
  isManual = false,
) {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

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

  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  const agent = createMonthlyGeneratorAgent(toneProfile);

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

  const prompt = `Synthesize these weekly narratives into a monthly reflection in the user's authentic voice.

MONTH: ${monthName}

WEEKLY NARRATIVES:
${weeklyNarratives}

Your task: Show the arc of this month. What was it fundamentally about? How did things progress from week 1 to week ${weeklyPosts.length}? What foundation was built? What does this enable going forward? Write it exactly as the user would - same style, same voice.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await withTimeout(agent.generate(prompt), 60000);
    });

    const fullText = response.text.trim();

    const parts = fullText.split(
      /THEMES:|ACHIEVEMENTS:|SHIFTS:|MOMENTUM:|NEXT_FOCUS:/,
    );
    const narrative = parts[0].trim();
    const themes =
      parts[1]
        ?.trim()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];
    const achievements =
      parts[2]
        ?.trim()
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean) || [];
    const shifts =
      parts[3]
        ?.trim()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const momentum = parts[4]?.trim() || "";
    const nextFocus =
      parts[5]
        ?.trim()
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean) || [];

    const metadata = {
      themes,
      achievements,
      shifts,
      momentum,
      nextFocus,
      weeksCovered: weeklyPosts.length,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    let generatedPost;
    try {
      generatedPost = await prisma.$transaction(async (tx) => {
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

        const previousVersions = await tx.generatedPost.count({
          where: {
            userId,
            type: "MONTHLY",
            date: monthStart,
          },
        });

        return await tx.generatedPost.create({
          data: {
            userId,
            type: "MONTHLY",
            date: monthStart,
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
