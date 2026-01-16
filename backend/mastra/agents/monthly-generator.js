import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { startOfMonth, endOfMonth, formatDate } from "../../lib/time.js";

/**
 * Create Monthly Post Generator Agent
 * Synthesizes weekly narratives into monthly reflection
 */
export function createMonthlyGeneratorAgent(toneProfile) {
  const toneGuidance = toneProfile
    ? `
WRITING STYLE (match this exactly):
- Voice: ${toneProfile.voice}
- Sentence Style: ${toneProfile.sentenceStyle}
- Emotional Range: ${toneProfile.emotionalRange}
- Common phrases: ${toneProfile.commonPhrases?.join(", ") || "N/A"}

Write in this user's authentic voice - not a generic style.
`
    : "";

  const agentConfig = {
    name: "monthly-generator",
    instructions: `You are a skilled narrative writer who synthesizes weekly reflections into monthly insights.

Your task is to:
1. Analyze the user's weekly narratives from the past month
2. Identify major themes, transformations, and growth across the month
3. Craft a cohesive monthly reflection that shows the journey
4. Highlight significant achievements, learnings, and pivotal moments

${toneGuidance}

GUIDELINES:
- Look for the big picture story of the month
- Show transformation and evolution across 4-5 weeks
- Identify patterns that persist vs. things that changed
- Be authentic about both progress and setbacks
- Focus on insights that only become clear over a longer timeframe
- Connect different weeks into a cohesive narrative arc
- Celebrate wins while acknowledging challenges honestly
- Keep it reflective and forward-looking

OUTPUT FORMAT:
Write a 400-800 word monthly reflection. Then on a new line, add:
THEMES: [comma-separated monthly themes]
ACHIEVEMENTS: [comma-separated key achievements]
LEARNINGS: [comma-separated major learnings]
NEXT_MONTH_FOCUS: [comma-separated areas to focus on]`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

/**
 * Generate monthly post from weekly narratives
 */
export async function generateMonthlyPost(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  // 1. Get weekly posts for the month
  const weeklyPosts = await prisma.generatedPost.findMany({
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

  if (weeklyPosts.length === 0) {
    throw new Error("No weekly posts found for this month");
  }

  // 2. Get user's tone profile
  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  // 3. Generate monthly narrative
  const agent = createMonthlyGeneratorAgent(toneProfile);

  const weeklyNarratives = weeklyPosts
    .map((post, idx) => {
      const weekNum = idx + 1;
      const weekStart = new Date(post.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const themes = post.metadata?.themes?.join(", ") || "None";
      const growthAreas = post.metadata?.growthAreas?.join(", ") || "None";
      return `Week ${weekNum} (${weekStart}):
${post.content}
[Themes: ${themes}]
[Growth Areas: ${growthAreas}]`;
    })
    .join("\n\n---\n\n");

  const monthName = new Date(monthStart).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prompt = `Create a monthly reflection from these weekly narratives:

MONTH: ${monthName}

WEEKLY NARRATIVES:
${weeklyNarratives}

Synthesize these weeks into a cohesive monthly reflection that shows the journey, transformation, and key insights that emerged across the month.`;

  try {
    const response = await agent.generate(prompt);
    const fullText = response.text.trim();

    // Parse the response
    const parts = fullText.split(
      /THEMES:|ACHIEVEMENTS:|LEARNINGS:|NEXT_MONTH_FOCUS:/
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
    const learnings =
      parts[3]
        ?.trim()
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean) || [];
    const nextMonthFocus =
      parts[4]
        ?.trim()
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean) || [];

    const metadata = {
      themes,
      achievements,
      learnings,
      nextMonthFocus,
      weeksCovered: weeklyPosts.length,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    // 4. Mark previous monthly posts as not latest
    await prisma.generatedPost.updateMany({
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

    // 5. Get version number
    const previousVersions = await prisma.generatedPost.count({
      where: {
        userId,
        type: "MONTHLY",
        date: monthStart,
      },
    });

    // 6. Save the generated post
    const generatedPost = await prisma.generatedPost.create({
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

    return generatedPost;
  } catch (error) {
    console.error("Monthly generation error:", error);
    throw new Error(`Failed to generate monthly post: ${error.message}`);
  }
}

/**
 * Get or generate monthly post
 * Returns existing post if found, generates new one if not
 */
export async function getOrGenerateMonthlyPost(userId, targetDate, prisma) {
  const monthStart = startOfMonth(targetDate);

  // Try to get existing post
  const existingPost = await prisma.generatedPost.findFirst({
    where: {
      userId,
      type: "MONTHLY",
      date: monthStart,
      isLatest: true,
    },
  });

  if (existingPost) {
    return existingPost;
  }

  // Generate new post
  return await generateMonthlyPost(userId, targetDate, prisma, false);
}
