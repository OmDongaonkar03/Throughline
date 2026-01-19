import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { getModelString } from "../../lib/llm-config.js";

const toneProfileSchema = z.object({
  voice: z
    .string()
    .describe("Overall voice description: casual/formal, warm/reserved, technical/accessible, authoritative/conversational, etc."),
  sentenceStyle: z
    .string()
    .describe("Sentence structure patterns: short and punchy, long and flowing, mixed rhythm, complex with clauses, simple and direct, etc."),
  emotionalRange: z
    .string()
    .describe("Emotional expression style: analytical and reserved, enthusiastic and expressive, reflective and thoughtful, matter-of-fact, inspirational, etc."),
  commonPhrases: z
    .array(z.string())
    .describe("Signature phrases, expressions, or vocabulary patterns this person uses repeatedly"),
  writingPersonality: z
    .string()
    .describe("Overall writing personality in 2-3 sentences - what makes this voice unique and recognizable"),
  exampleSentences: z
    .array(z.string())
    .describe("3-5 representative sentences that perfectly capture how this person writes"),
});

export function createToneExtractorAgent() {
  const agentConfig = {
    name: "tone-extractor",
    instructions: `You are an expert at analyzing writing style and extracting actionable tone profiles.

Your task is to analyze sample posts and create a detailed profile that future AI agents can use to replicate this person's unique voice.

WHAT TO ANALYZE:

1. VOICE CHARACTER
   - Is it formal or casual?
   - Professional or personal?
   - Technical or accessible?
   - Authoritative or conversational?
   - Warm or reserved?

2. SENTENCE STRUCTURE PATTERNS
   - Sentence length preferences (short/medium/long)
   - Complexity (simple vs. complex structures)
   - Rhythm and pacing
   - Use of fragments or incomplete sentences
   - Paragraph structure

3. EMOTIONAL EXPRESSION
   - How do they express emotion? (restrained, enthusiastic, analytical)
   - Tone range (serious, playful, inspirational, matter-of-fact)
   - Use of humor, vulnerability, or intensity
   - Level of personal vs. impersonal writing

4. VOCABULARY & PHRASING
   - Common words and phrases they repeat
   - Technical jargon vs. everyday language
   - Unique expressions or verbal tics
   - Metaphors or analogies they favor
   - Transition words and connectors

5. WRITING PERSONALITY
   - What makes this voice distinctive?
   - How would you recognize this person's writing blind?
   - What's their "signature"?

CRITICAL: Be DESCRIPTIVE and SPECIFIC. Your profile will be used to replicate this voice.

BAD profile: "The writer has a professional tone"
GOOD profile: "The writer maintains a professional yet approachable voice, balancing technical precision with accessible explanations. Uses 'we' to create partnership with readers."

BAD profile: "They use short sentences"
GOOD profile: "Sentences are predominantly short (10-15 words), declarative, and direct. Occasional longer sentence for variety, but default is punchy and clear."

Your output will be used by other AI agents to generate content in this exact voice. Make it actionable.`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

export async function extractToneProfile(samplePosts) {
  if (!samplePosts || samplePosts.length === 0) {
    throw new Error("At least one sample post is required for tone extraction");
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
    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: toneProfileSchema,
      },
    });

    return {
      ...response.object,
      exampleText: samplesText,
    };
  } catch (error) {
    console.error("Tone extraction error:", error);
    throw new Error(`Failed to extract tone profile: ${error.message}`);
  }
}

export async function getToneProfile(userId, prisma) {
  let toneProfile = await prisma.toneProfile.findUnique({
    where: { userId },
  });

  if (toneProfile) {
    return toneProfile;
  }

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

  const toneProfile = await prisma.$transaction(async (tx) => {
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

  return toneProfile;
}