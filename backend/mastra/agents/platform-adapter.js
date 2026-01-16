import { Agent } from "@mastra/core/agent";
import { getModelString } from "../../lib/llm-config.js";
import { getPlatformSpec } from "../../lib/platform-specs.js";

export function createPlatformAdapterAgent() {
  const agentConfig = {
    name: "platform-adapter",
    instructions: `You are an expert at adapting content for different social media platforms.

Your task is to take a base narrative and optimize it for a specific platform while:
1. Maintaining the core message and insights
2. Matching the platform's style and constraints
3. Keeping the user's original tone and voice
4. Following platform best practices

Be creative but faithful to the original content.`,
    model: getModelString(),
  };

  return new Agent(agentConfig);
}

/**
 * Adapt base content for a specific platform
 */
export async function adaptForPlatform(
  baseContent,
  metadata,
  platform,
  toneProfile
) {
  const spec = getPlatformSpec(platform);
  const agent = createPlatformAdapterAgent();

  const toneGuidance = toneProfile
    ? `
User's writing style:
- Voice: ${toneProfile.voice}
- Sentence Style: ${toneProfile.sentenceStyle}
- Emotional Range: ${toneProfile.emotionalRange}
`
    : "";

  const prompt = `Adapt this narrative for ${spec.name}:

BASE NARRATIVE:
${baseContent}

KEY THEMES: ${metadata.themes?.join(", ") || "None"}
HIGHLIGHTS: ${metadata.highlights?.join(", ") || "None"}

${toneGuidance}

PLATFORM REQUIREMENTS (${spec.name}):
- Max length: ${spec.maxLength} characters
- Style: ${spec.style}
- Tone: ${spec.tone}
- Hashtag limit: ${spec.hashtagLimit}
${spec.features.emojis ? "- You can use emojis" : "- No emojis"}

OUTPUT FORMAT:
Return ONLY the adapted post content, nothing else. No preamble, no explanation.
${
  spec.hashtagLimit > 0
    ? "Include relevant hashtags at the end."
    : "Do not include hashtags."
}`;

  try {
    const response = await agent.generate(prompt);
    const content = response.text.trim();

    // Extract hashtags if present
    const hashtags =
      spec.hashtagLimit > 0 ? extractHashtags(content, spec.hashtagLimit) : [];

    return {
      content,
      hashtags,
      platform,
    };
  } catch (error) {
    console.error(`Platform adaptation error (${platform}):`, error);
    throw new Error(`Failed to adapt for ${platform}: ${error.message}`);
  }
}

/**
 * Extract hashtags from content
 */
function extractHashtags(content, limit) {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex) || [];
  return matches.slice(0, limit);
}
