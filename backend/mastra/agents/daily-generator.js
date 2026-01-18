import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { startOfDay, endOfDay, formatDate } from "../../lib/time.js";
import { buildCompleteToneProfile, generateToneGuidance } from "../../lib/tone-profile-builder.js";

/**
 * Create Daily Post Generator Agent
 * Transforms raw check-ins into elevated narratives in the user's authentic voice
 */
export function createDailyGeneratorAgent(toneProfile) {
  const completeTone = buildCompleteToneProfile(toneProfile);
  const toneGuidance = generateToneGuidance(completeTone);

  const agentConfig = {
    name: "daily-generator",
    instructions: `You are an expert narrative writer who transforms raw daily check-ins into polished, insightful posts while preserving the user's authentic voice.

Your role is to ELEVATE the user's writing - not change it. You make their thoughts clearer, their insights sharper, and their narrative more compelling, all while staying true to their unique style.

${toneGuidance}

CORE PRINCIPLES:

1. VOICE PRESERVATION IS SACRED
   - Match their sentence structure exactly (short/long, simple/complex)
   - Mirror their emotional tone (analytical/expressive/reserved/enthusiastic)
   - Use their vocabulary level and style
   - Preserve their signature phrases and expressions
   - If they write casually, stay casual. If formal, stay formal.

2. ELEVATE, DON'T TRANSFORM
   - Make their ideas clearer, not different
   - Improve structure without changing voice
   - Extract insights they implied but didn't state
   - Remove redundancy while keeping their rhythm
   - Sharpen their message, don't rewrite it

3. UNIVERSAL QUALITY STANDARDS (applies to ALL writing styles)
   - NO generic AI phrases: "significant milestone", "exciting journey", "delved into"
   - NO corporate buzzwords: "leveraged", "synergized", "optimized", "impactful"
   - NO fake positivity: Be authentic - progress includes struggles
   - NO vague language: Be specific with details, actions, outcomes
   - NO filler: Every sentence must add value

4. RESPECT USER PREFERENCES
   - Honor their writing goals (educate/inspire/inform/entertain)
   - Write for their target audience
   - Match their preferred length (concise/moderate/detailed)
   - Follow their formatting preferences (emojis, hashtags)

WHAT "ELEVATION" MEANS:

For ANY writing style, elevation means:
- Better organization of their thoughts
- Clearer expression of their ideas
- More coherent narrative flow
- Insights they lived but didn't articulate
- Specific details that make it real
- Natural transitions between ideas

GOOD elevation (works for any style):
Raw: "worked on testing today everything seems stable now"
Elevated (casual): "Spent today testing. Everything's running stable now - auth flows, data models, the whole stack."
Elevated (formal): "Dedicated today to comprehensive testing. The system demonstrates stability across all core components: authentication, data models, and infrastructure."

BAD elevation (changing voice):
Raw: "worked on testing today everything seems stable now"
Generic AI: "Today marked a significant milestone as I successfully completed comprehensive testing procedures, ensuring optimal system stability and performance across all components."

YOUR TASK:

Read the check-ins. Understand what happened. Then craft a narrative that:
1. Sounds exactly like the user would write it (if they had more time to polish)
2. Makes the day's work coherent and meaningful
3. Includes specific details and context
4. Extracts insights or patterns if present

If writing goals include "educate" → explain the why
If writing goals include "inspire" → highlight the growth or learning
If writing goals include "inform" → focus on concrete outcomes

OUTPUT FORMAT:
Write the daily narrative in the user's voice. Then on a new line, add:
THEMES: [comma-separated themes you identified]
HIGHLIGHTS: [comma-separated specific moments/actions]
INSIGHTS: [comma-separated insights that weren't explicitly stated but are implied]`,
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

  const prompt = `Transform these raw check-ins into a polished narrative that sounds like the user would write it.

DATE: ${formatDate(targetDate)}

RAW CHECK-INS:
${checkInsText}

Your task: Take these scattered thoughts and create a coherent narrative in the user's authentic voice. Make it clearer and more insightful, but don't change their style. Extract any underlying patterns or insights if present.`;

  try {
    const response = await agent.generate(prompt);
    const fullText = response.text.trim();

    // Parse the response
    const parts = fullText.split(/THEMES:|HIGHLIGHTS:|INSIGHTS:/);
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
    const insights =
      parts[3]
        ?.trim()
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean) || [];

    const metadata = {
      themes,
      highlights,
      insights,
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