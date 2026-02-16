import { z } from "zod";
import { getModelString } from "../../../lib/llm-config.js";
import { retryWithBackoff, withTimeout } from "../../../lib/llm-retry.js";
import {
  ValidationError,
  LLMError,
  DatabaseError,
} from "../../../utils/errors.js";
import { createToneExtractorAgent } from "../prompts/tone-extractor-prompt.js";
import logger, { logError } from "../../../utils/logger.js";

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

export async function extractToneProfile(
  samplePosts,
  prisma = null,
  userId = null,
) {
  if (!samplePosts || samplePosts.length === 0) {
    logger.warn("Tone extraction attempted with no sample posts", { userId });
    throw new ValidationError(
      "At least one sample post is required for tone extraction",
    );
  }

  logger.info("Starting tone profile extraction", {
    userId,
    samplePostCount: samplePosts.length,
  });

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
    logger.debug("Sending samples to LLM for tone extraction", {
      userId,
      samplePostCount: samplePosts.length,
      modelUsed: getModelString(),
    });

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

    logger.info("Tone extraction completed successfully", {
      userId,
      samplePostCount: samplePosts.length,
      modelUsed: getModelString(),
      tokenUsage: response.usage,
    });

    return {
      ...response.object,
      exampleText: samplesText,
      tokenUsage: response.usage,
    };
  } catch (error) {
    logError("Tone extraction error", error, {
      userId,
      samplePostCount: samplePosts.length,
    });
    throw new LLMError(`Failed to extract tone profile: ${error.message}`);
  }
}

export async function getToneProfile(userId, prisma) {
  logger.debug("Fetching tone profile", { userId });

  let toneProfile;
  try {
    toneProfile = await prisma.toneProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    logError("Failed to fetch tone profile", error, { userId });
    throw new DatabaseError(`Failed to fetch tone profile: ${error.message}`);
  }

  if (toneProfile) {
    logger.debug("Existing tone profile found", {
      userId,
      profileId: toneProfile.id,
      extractedAt: toneProfile.extractedAt,
    });
    return toneProfile;
  }

  logger.debug("No tone profile found, extracting from sample posts", {
    userId,
  });

  let samplePosts;
  try {
    samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    logError("Failed to fetch sample posts for tone extraction", error, {
      userId,
    });
    throw new DatabaseError(`Failed to fetch sample posts: ${error.message}`);
  }

  if (samplePosts.length === 0) {
    logger.warn("No sample posts found for tone extraction", { userId });
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

    logger.info("New tone profile created", {
      userId,
      profileId: toneProfile.id,
      samplePostCount: samplePosts.length,
    });
  } catch (error) {
    logError("Failed to save tone profile", error, { userId });
    throw new DatabaseError(`Failed to save tone profile: ${error.message}`);
  }

  return toneProfile;
}

export async function updateToneProfile(userId, prisma) {
  logger.info("Updating tone profile", { userId });

  let samplePosts;
  try {
    samplePosts = await prisma.samplePost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    logError("Failed to fetch sample posts for tone profile update", error, {
      userId,
    });
    throw new DatabaseError(`Failed to fetch sample posts: ${error.message}`);
  }

  if (samplePosts.length === 0) {
    logger.warn("No sample posts found for tone profile update", { userId });
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

    logger.info("Tone profile updated successfully", {
      userId,
      profileId: toneProfile.id,
      samplePostCount: samplePosts.length,
    });
  } catch (error) {
    logError("Failed to update tone profile", error, { userId });
    throw new DatabaseError(`Failed to update tone profile: ${error.message}`);
  }

  return toneProfile;
}
