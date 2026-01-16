import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { getModelString } from "../../lib/llm-config.js";

/**
 * Tone Profile Schema
 * Defines the structure of extracted tone profile
 */
const toneProfileSchema = z.object({
  voice: z
    .string()
    .describe("Overall voice: casual, professional, technical, friendly, etc."),
  sentenceStyle: z
    .string()
    .describe("Sentence structure: short/punchy, flowing, mixed, etc."),
  emotionalRange: z
    .string()
    .describe("Emotional expression: reserved, expressive, analytical, etc."),
  commonPhrases: z
    .array(z.string())
    .describe("Common phrases or expressions the user uses"),
  writingPersonality: z
    .string()
    .describe("Overall writing personality in 2-3 sentences"),
  exampleSentences: z
    .array(z.string())
    .describe("3-5 example sentences that capture the tone"),
});

/**
 * Create Tone Extractor Agent
 * Analyzes sample posts to extract user's writing style
 */
export function createToneExtractorAgent() {
  const agentConfig = {
    name: "tone-extractor",
    instructions: `You are an expert at analyzing writing style and tone.
    
Your task is to analyze sample posts and extract a detailed tone profile that can be used to generate new content in the same style.

Key things to identify:
1. Voice: Is it casual/formal, technical/accessible, friendly/professional?
2. Sentence Structure: Short and punchy? Long and flowing? Mixed?
3. Emotional Range: Reserved and factual? Expressive and emotive? Analytical?
4. Common Phrases: What words, phrases, or expressions does this person use repeatedly?
5. Writing Personality: What's unique about how this person writes?

Be specific and actionable. The profile you create will be used to generate new posts that sound like this person.`,
    model: getModelString(), 
  };

  return new Agent(agentConfig);
}

// Extract tone profile from sample posts
export async function extractToneProfile(samplePosts) {
  if (!samplePosts || samplePosts.length === 0) {
    throw new Error("At least one sample post is required for tone extraction");
  }

  const agent = createToneExtractorAgent();

  // Combine sample posts with separators
  const samplesText = samplePosts
    .map((post, idx) => `Sample ${idx + 1}:\n${post}`)
    .join("\n\n---\n\n");

  const prompt = `Analyze these writing samples and extract the writing style/tone profile:

${samplesText}

Provide a detailed tone profile that captures this person's unique writing style.`;

  try {
    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: toneProfileSchema,
      },
    });

    return {
      ...response.object,
      exampleText: samplesText, // Store original samples for reference
    };
  } catch (error) {
    console.error("Tone extraction error:", error);
    throw new Error(`Failed to extract tone profile: ${error.message}`);
  }
}

// Get tone profile from database or extract if not exists
export async function getToneProfile(userId, prisma) {
  // Check if tone profile exists
  let toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  if (toneProfile) {
    return toneProfile;
  }

  // If not, extract from sample posts
  const samplePosts = await prisma.samplePost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5, // Use up to 5 sample posts
  });

  if (samplePosts.length === 0) {
    throw new Error("No sample posts found. Please add sample posts first.");
  }

  // Extract tone
  const extractedProfile = await extractToneProfile(
    samplePosts.map((post) => post.content)
  );

  // Save to database
  toneProfile = await prisma.toneProfile.create({
    data: {
      userId,
      voice: extractedProfile.voice,
      sentenceStyle: extractedProfile.sentenceStyle,
      emotionalRange: extractedProfile.emotionalRange,
      commonPhrases: extractedProfile.commonPhrases,
      exampleText: extractedProfile.exampleText,
      fullProfile: extractedProfile,
      modelUsed: getModelString(),
      extractedAt: new Date(),
    },
  });

  return toneProfile;
}

// Update tone profile when sample posts change
export async function updateToneProfile(userId, prisma) {
  const samplePosts = await prisma.samplePost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (samplePosts.length === 0) {
    throw new Error("No sample posts found. Please add sample posts first.");
  }

  const extractedProfile = await extractToneProfile(
    samplePosts.map((post) => post.content)
  );

  // Delete old profile and create new one
  await prisma.toneProfile.deleteMany({
    where: { userId },
  });

  const toneProfile = await prisma.toneProfile.create({
    data: {
      userId,
      voice: extractedProfile.voice,
      sentenceStyle: extractedProfile.sentenceStyle,
      emotionalRange: extractedProfile.emotionalRange,
      commonPhrases: extractedProfile.commonPhrases,
      exampleText: extractedProfile.exampleText,
      fullProfile: extractedProfile,
      modelUsed: getModelString(),
      extractedAt: new Date(),
    },
  });

  return toneProfile;
}
