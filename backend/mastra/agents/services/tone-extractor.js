import { z } from "zod";
import { getModelString } from "../../../lib/llm-config.js";
import { retryWithBackoff, withTimeout } from "../../../lib/llm-retry.js";
import {
  ValidationError,
  LLMError,
  DatabaseError,
} from "../../../utils/errors.js";
import { createToneExtractorAgent } from "../prompts/tone-extractor-prompt.js";

const toneProfileSchema = z.object({
  voice: z
    .string()
    .describe(
      "Overall voice description: casual/formal, warm/reserved, technical/accessible, authoritative/conversational, etc.",
    ),
  sentenceStyle: z
    .string()
    .describe(
      "Sentence structure patterns: short and punchy, long and flowing, mixed rhythm, complex with clauses, simple and direct, etc.",
    ),
  emotionalRange: z
    .string()
    .describe(
      "Emotional expression style: analytical and reserved, enthusiastic and expressive, reflective and thoughtful, matter-of-fact, inspirational, etc.",
    ),
  commonPhrases: z
    .array(z.string())
    .describe(
      "Signature phrases, expressions, or vocabulary patterns this person uses repeatedly",
    ),
  writingPersonality: z
    .string()
    .describe(
      "Overall writing personality in 2-3 sentences - what makes this voice unique and recognizable",
    ),
  exampleSentences: z
    .array(z.string())
    .describe(
      "3-5 representative sentences that perfectly capture how this person writes",
    ),
});

export async function extractToneProfile(samplePosts, prisma = null, userId = null) {
  if (!samplePosts || samplePosts.length === 0) {
    throw new ValidationError(
      "At least one sample post is required for tone extraction",
    );
  }

  const agent = createToneExtractorAgent();

  const samplesText = samplePosts
    .map((post, idx) => `=== SAMPLE ${idx + 1} ===\n${post}`)
    .join("\n\n");

  const prompt = `Analyze these writing samples and extract a comprehensive tone profile.

${samplesText}

Create a detailed profile that captures:
1. The writer's unique voice character
2. Their sentence structure patterns
3. Their emotional expression style
4. Their signature phrases and vocabulary
5. What makes their writing distinctive

Be specific and actionable. This profile will be used to generate new content that sounds exactly like this person.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await withTimeout(
        agent.generate(prompt, {
          structuredOutput: {
            schema: toneProfileSchema,
          },
        }),
        60000,
      );
    });

    // Log token usage for monitoring
    if (response.usage) {
      console.log('Tone extraction token usage:', {
        userId,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      });
    }

    return {
      ...response.object,
      exampleText: samplesText,
      tokenUsage: response.usage,
    };
  } catch (error) {
    console.error("Tone extraction error:", error);
    throw new LLMError(`Failed to extract tone profile: ${error.message}`);
  }
}

export async function getToneProfile(userId, prisma) {
  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  if (toneProfile) {
    return toneProfile;
  }

  let samplePosts;
  try {
    samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch sample posts: ${error.message}`);
  }

  if (samplePosts.length === 0) {
    throw new ValidationError(
      "No sample posts found. Please add sample posts first.",
    );
  }

  const extractedProfile = await extractToneProfile(
    samplePosts.map((post) => post.content),
    prisma,
    userId,
  );

  try {
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
  } catch (error) {
    throw new DatabaseError(`Failed to save tone profile: ${error.message}`);
  }

  return toneProfile;
}

export async function updateToneProfile(userId, prisma) {
  let samplePosts;
  try {
    samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to fetch sample posts: ${error.message}`);
  }

  if (samplePosts.length === 0) {
    throw new ValidationError(
      "No sample posts found. Please add sample posts first.",
    );
  }

  const extractedProfile = await extractToneProfile(
    samplePosts.map((post) => post.content),
    prisma,
    userId,
  );

  let toneProfile;
  try {
    toneProfile = await prisma.$transaction(async (tx) => {
      await tx.toneProfile.deleteMany({
        where: { userId },
      });

      return await tx.toneProfile.create({
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
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update tone profile: ${error.message}`);
  }

  return toneProfile;
}