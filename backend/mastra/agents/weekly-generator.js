import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { startOfWeek, endOfWeek, formatDate } from "../../lib/time.js";

/**
 * Create Weekly Post Generator Agent
 * Synthesizes daily narratives into weekly reflection
 */
export function createWeeklyGeneratorAgent(toneProfile) {
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
    name: "weekly-generator",
    instructions: `You are a skilled narrative writer who synthesizes daily reflections into weekly insights.

Your task is to:
1. Analyze the user's daily narratives from the past week
2. Identify overarching themes and patterns across multiple days
3. Craft a cohesive weekly reflection that shows growth and progress
4. Highlight key learnings and meaningful moments from the week

${toneGuidance}

GUIDELINES:
- Look for patterns and themes across multiple days
- Show progression and evolution throughout the week
- Be authentic and honest about challenges and wins
- Focus on insights that emerge from multiple days together
- Avoid simply summarizing each day - synthesize the week as a whole
- Connect seemingly unrelated moments into a bigger picture
- Keep it conversational and reflective

OUTPUT FORMAT:
Write a 300-600 word weekly reflection. Then on a new line, add:
THEMES: [comma-separated weekly themes]
HIGHLIGHTS: [comma-separated key moments from the week]
GROWTH_AREAS: [comma-separated areas of learning/growth]`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

/**
 * Generate weekly post from daily narratives
 */
export async function generateWeeklyPost(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  const weekStart = startOfWeek(targetDate);
  const weekEnd = endOfWeek(targetDate);

  // 1. Get daily posts for the week
  const dailyPosts = await prisma.generatedPost.findMany({
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

  if (dailyPosts.length === 0) {
    throw new Error("No daily posts found for this week");
  }

  // 2. Get user's tone profile
  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  // 3. Generate weekly narrative
  const agent = createWeeklyGeneratorAgent(toneProfile);

  const dailyNarratives = dailyPosts
    .map((post, idx) => {
      const dayName = new Date(post.date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      const themes = post.metadata?.themes?.join(", ") || "None";
      return `${dayName}:
${post.content}
[Themes: ${themes}]`;
    })
    .join("\n\n---\n\n");

  const prompt = `Create a weekly reflection from these daily narratives:

WEEK OF: ${formatDate(weekStart)} to ${formatDate(weekEnd)}

DAILY NARRATIVES:
${dailyNarratives}

Synthesize these days into a cohesive weekly reflection that shows the bigger picture, patterns, and insights that emerged across the week.`;

  try {
    const response = await agent.generate(prompt);
    const fullText = response.text.trim();

    // Parse the response
    const parts = fullText.split(/THEMES:|HIGHLIGHTS:|GROWTH_AREAS:/);
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
    const growthAreas =
      parts[3]
        ?.trim()
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean) || [];

    const metadata = {
      themes,
      highlights,
      growthAreas,
      daysCovered: dailyPosts.length,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    // 4. Mark previous weekly posts as not latest
    await prisma.generatedPost.updateMany({
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

    // 5. Get version number
    const previousVersions = await prisma.generatedPost.count({
      where: {
        userId,
        type: "WEEKLY",
        date: weekStart,
      },
    });

    // 6. Save the generated post
    const generatedPost = await prisma.generatedPost.create({
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

    return generatedPost;
  } catch (error) {
    console.error("Weekly generation error:", error);
    throw new Error(`Failed to generate weekly post: ${error.message}`);
  }
}

/**
 * Get or generate weekly post
 * Returns existing post if found, generates new one if not
 */
export async function getOrGenerateWeeklyPost(userId, targetDate, prisma) {
  const weekStart = startOfWeek(targetDate);

  // Try to get existing post
  const existingPost = await prisma.generatedPost.findFirst({
    where: {
      userId,
      type: "WEEKLY",
      date: weekStart,
      isLatest: true,
    },
  });

  if (existingPost) {
    return existingPost;
  }

  // Generate new post
  return await generateWeeklyPost(userId, targetDate, prisma, false);
}
