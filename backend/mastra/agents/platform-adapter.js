import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { getPlatformSpec } from "../../lib/platform-specs.js";
import { buildCompleteToneProfile } from "../../lib/tone-profile-builder.js";
import { retryWithBackoff, withTimeout } from "../../lib/llm-retry.js";
import { LLMError } from "../../utils/errors.js";
import {
  savePlatformPostTokenUsage,
  calculateEstimatedCost,
} from "../../lib/token-usage.js";

export function createPlatformAdapterAgent() {
  const agentConfig = {
    name: "platform-adapter",
    instructions: `You are an expert at adapting content for different social media platforms.

Your task is to take a base narrative and optimize it for a specific platform while:
1. Maintaining the core message and insights
2. Matching the platform's style and constraints
3. PRESERVING THE USER'S EXACT VOICE AND TONE
4. Following platform best practices
5. Respecting user preferences for emojis, hashtags, length
6. PRESERVING PARAGRAPH STRUCTURE - maintain line breaks between distinct ideas/sections

CRITICAL: You are NOT rewriting in a "platform style" - you're adapting the user's authentic voice to fit platform constraints. The voice stays the same, only the format changes.

FORMATTING RULES:
- Preserve paragraph breaks (blank lines) from the original narrative
- Each distinct idea, time period, or theme should remain in its own paragraph
- Use double line breaks to separate paragraphs
- Maintain the visual structure and readability of the original`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

export async function adaptForPlatform(
  baseContent,
  metadata,
  platform,
  toneProfile,
  prisma = null,
  platformPostId = null,
) {
  const spec = getPlatformSpec(platform);
  const agent = createPlatformAdapterAgent();
  const completeTone = buildCompleteToneProfile(toneProfile);

  let toneGuidance = "";
  if (completeTone) {
    toneGuidance = `
USER'S VOICE (preserve this exactly):
- Voice: ${completeTone.voice}
- Sentence Style: ${completeTone.sentenceStyle}
- Emotional Range: ${completeTone.emotionalRange}`;

    if (completeTone.commonPhrases?.length > 0) {
      toneGuidance += `
- Common Phrases: ${completeTone.commonPhrases.join(", ")}`;
    }
  }

  let preferenceGuidance = `
USER PREFERENCES:`;

  if (completeTone) {
    if (completeTone.includeEmojis) {
      preferenceGuidance += `
- Emojis: Use sparingly when natural (user allows emojis)`;
    } else {
      preferenceGuidance += `
- Emojis: NEVER use (user prefers no emojis)`;
    }

    if (completeTone.includeHashtags && spec.hashtagLimit > 0) {
      preferenceGuidance += `
- Hashtags: Include ${spec.hashtagLimit} relevant hashtags at the end`;
    } else {
      preferenceGuidance += `
- Hashtags: Do not include (user prefers no hashtags or platform doesn't support them)`;
    }

    if (completeTone.preferredLength) {
      const lengthMap = {
        concise:
          "Keep it tight - aim for the shorter end of the platform limit",
        moderate: "Use moderate length - find the sweet spot",
        detailed:
          "Use more space - develop ideas more fully within platform limits",
      };
      preferenceGuidance += `
- Length: ${lengthMap[completeTone.preferredLength] || completeTone.preferredLength}`;
    }

    if (completeTone.targetAudience?.length > 0) {
      preferenceGuidance += `
- Target Audience: ${completeTone.targetAudience.join(", ")}`;
    }
  }

  const prompt = `Adapt this narrative for ${spec.name} while preserving the user's exact voice AND paragraph structure.

BASE NARRATIVE:
${baseContent}

KEY THEMES: ${metadata.themes?.join(", ") || "None"}
HIGHLIGHTS: ${metadata.highlights?.join(", ") || "None"}
INSIGHTS: ${metadata.insights?.join(", ") || metadata.patterns?.join(", ") || "None"}

${toneGuidance}

${preferenceGuidance}

PLATFORM CONSTRAINTS (${spec.name}):
- Max length: ${spec.maxLength} characters
- Style: ${spec.style}
- Tone: ${spec.tone}

ADAPTATION STRATEGY:
1. Keep the user's voice and sentence structure
2. PRESERVE paragraph breaks - each paragraph should remain separate
3. Adapt length to fit platform constraints
4. Respect user's emoji/hashtag preferences
5. Maintain the core insights and message
6. Format appropriately for the platform

IMPORTANT: When shortening content, remove sentences or paragraphs, but DO NOT merge paragraphs together. Keep the paragraph structure intact.

OUTPUT FORMAT:
Return ONLY the adapted post content with preserved paragraph breaks. No preamble, no explanation, no meta-commentary.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await withTimeout(agent.generate(prompt), 60000);
    });

    let content = response.text.trim();

    // Remove markdown code block formatting if present
    content = content.replace(/```\n?/g, "").trim();

    // Normalize paragraph breaks to exactly 2 newlines
    content = normalizeLineBreaks(content);

    let hashtags = [];
    if (completeTone?.includeHashtags && spec.hashtagLimit > 0) {
      hashtags = extractHashtags(content, spec.hashtagLimit);
    } else {
      content = content.replace(/#\w+/g, "").trim();
    }

    if (completeTone && !completeTone.includeEmojis) {
      content = removeEmojis(content);
    }

    // Save token usage if prisma and platformPostId are provided
    if (prisma && platformPostId) {
      const modelUsed = getModelString();
      const estimatedCost = calculateEstimatedCost(response.usage, modelUsed);

      savePlatformPostTokenUsage(prisma, {
        platformPostId,
        usage: response.usage,
        modelUsed,
        platform: spec.name.toUpperCase(),
        estimatedCost,
      });
    }

    return {
      content,
      hashtags,
      platform,
      usage: response.usage, // Return usage for caller to save if needed
    };
  } catch (error) {
    console.error(`Platform adaptation error (${platform}):`, error);
    throw new LLMError(`Failed to adapt for ${platform}: ${error.message}`);
  }
}

function normalizeLineBreaks(content) {
  // Replace Windows line endings with Unix
  content = content.replace(/\r\n/g, "\n");

  // Replace 3+ consecutive newlines with exactly 2 (paragraph break)
  content = content.replace(/\n{3,}/g, "\n\n");

  // Ensure we don't have single newlines that should be paragraph breaks
  // This preserves intentional paragraph structure
  return content.trim();
}

function removeEmojis(content) {
  // Remove emojis
  content = content.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    "",
  );

  content = content
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n");

  return content.trim();
}

function extractHashtags(content, limit) {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex) || [];
  return matches.slice(0, limit);
}