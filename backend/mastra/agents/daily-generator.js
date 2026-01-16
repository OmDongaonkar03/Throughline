import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { startOfDay, endOfDay, formatDate } from "../../lib/time.js";

/**
 * Create Daily Post Generator Agent
 * Generates base narrative from check-ins
 */
export function createDailyGeneratorAgent(toneProfile) {
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
    name: "daily-generator",
    instructions: `You are a skilled narrative writer who transforms daily check-ins into engaging, reflective posts.

Your task is to:
1. Analyze the user's check-ins for the day
2. Identify key themes, patterns, and insights
3. Craft a cohesive narrative that feels authentic and personal
4. Highlight meaningful moments and learnings

${toneGuidance}

GUIDELINES:
- Be authentic and honest, not overly positive
- Focus on insights and patterns, not just listing activities
- Keep it conversational and readable
- Include specific details that make it real
- Avoid generic motivational language
- Don't force positivity if the day was challenging

OUTPUT FORMAT:
Write a 200-400 word narrative. Then on a new line, add:
THEMES: [comma-separated themes]
HIGHLIGHTS: [comma-separated key moments]`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

/**
 * Generate daily post from check-ins
 */
export async function generateDailyPost(
  userId,
  targetDate,
  prisma,
  isManual = false
) {
  const startDate = startOfDay(targetDate);
  const endDate = endOfDay(targetDate);

  // 1. Get check-ins for the day
  const checkIns = await prisma.checkIn.findMany({
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

  if (checkIns.length === 0) {
    throw new Error("No check-ins found for this date");
  }

  // 2. Get user's tone profile
  const toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  // 3. Generate base narrative
  const agent = createDailyGeneratorAgent(toneProfile);

  const checkInsText = checkIns
    .map((c, idx) => {
      const time = new Date(c.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `[${time}] ${c.content}`;
    })
    .join("\n");

  const prompt = `Generate a reflective daily post from these check-ins:

DATE: ${formatDate(targetDate)}

CHECK-INS:
${checkInsText}

Create a narrative that weaves these moments together into something meaningful and authentic.`;

  try {
    const response = await agent.generate(prompt);
    const fullText = response.text.trim();

    // Parse the response
    const parts = fullText.split(/THEMES:|HIGHLIGHTS:/);
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

    const metadata = {
      themes,
      highlights,
      checkInCount: checkIns.length,
      generatedAt: new Date().toISOString(),
    };

    // 4. Mark previous posts as not latest
    await prisma.generatedPost.updateMany({
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

    // 5. Get version number
    const previousVersions = await prisma.generatedPost.count({
      where: {
        userId,
        type: "DAILY",
        date: startDate,
      },
    });

    // 6. Save the generated post
    const generatedPost = await prisma.generatedPost.create({
      data: {
        userId,
        type: "DAILY",
        date: startDate,
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
    console.error("Daily generation error:", error);
    throw new Error(`Failed to generate daily post: ${error.message}`);
  }
}

/**
 * Get or generate daily post
 * Returns existing post if found, generates new one if not
 */
export async function getOrGenerateDailyPost(userId, targetDate, prisma) {
  const startDate = startOfDay(targetDate);

  // Try to get existing post
  const existingPost = await prisma.generatedPost.findFirst({
    where: {
      userId,
      type: "DAILY",
      date: startDate,
      isLatest: true,
    },
  });

  if (existingPost) {
    return existingPost;
  }

  // Generate new post
  return await generateDailyPost(userId, targetDate, prisma, false);
}
