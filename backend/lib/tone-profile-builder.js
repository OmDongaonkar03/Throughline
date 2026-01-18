/**
 * Build comprehensive tone profile for agents
 * Merges AI-extracted + manual overrides + user preferences
 */
export function buildCompleteToneProfile(toneProfile) {
  if (!toneProfile) {
    return null;
  }

  // Priority: Manual overrides > AI-extracted
  const voice = toneProfile.customVoice || toneProfile.voice;
  const sentenceStyle = toneProfile.customSentenceStyle || toneProfile.sentenceStyle;
  const emotionalRange = toneProfile.customEmotionalRange || toneProfile.emotionalRange;

  // Parse JSON fields safely
  const commonPhrases = toneProfile.commonPhrases || [];
  const writingGoals = toneProfile.writingGoals || [];
  const targetAudience = toneProfile.targetAudience || [];
  const toneCharacteristics = toneProfile.toneCharacteristics || {};
  const avoidTopics = toneProfile.avoidTopics || [];

  return {
    // Core tone
    voice,
    sentenceStyle,
    emotionalRange,
    commonPhrases,

    // User preferences
    writingGoals,
    targetAudience,
    contentPurpose: toneProfile.contentPurpose,
    toneCharacteristics,
    avoidTopics,
    preferredLength: toneProfile.preferredLength,
    includeEmojis: toneProfile.includeEmojis,
    includeHashtags: toneProfile.includeHashtags,

    // Metadata
    isManuallyCustomized: toneProfile.manuallyEdited,
    fullProfile: toneProfile.fullProfile,
  };
}

/**
 * Generate tone guidance string for agent prompts
 */
export function generateToneGuidance(completeToneProfile) {
  if (!completeToneProfile) {
    return "";
  }

  let guidance = `
USER'S AUTHENTIC VOICE (preserve this exactly):
- Voice: ${completeToneProfile.voice}
- Sentence Structure: ${completeToneProfile.sentenceStyle}
- Emotional Tone: ${completeToneProfile.emotionalRange}`;

  if (completeToneProfile.commonPhrases?.length > 0) {
    guidance += `
- Signature Phrases: ${completeToneProfile.commonPhrases.join(", ")}`;
  }

  // Add user goals and audience
  if (completeToneProfile.writingGoals?.length > 0) {
    guidance += `

WRITING GOALS (what the user wants to achieve):
${completeToneProfile.writingGoals.map(g => `- ${g}`).join("\n")}`;
  }

  if (completeToneProfile.targetAudience?.length > 0) {
    guidance += `

TARGET AUDIENCE (who they're writing for):
${completeToneProfile.targetAudience.map(a => `- ${a}`).join("\n")}`;
  }

  if (completeToneProfile.contentPurpose) {
    guidance += `

CONTENT PURPOSE:
${completeToneProfile.contentPurpose}`;
  }

  // Add tone characteristics if provided
  if (completeToneProfile.toneCharacteristics && Object.keys(completeToneProfile.toneCharacteristics).length > 0) {
    guidance += `

TONE CHARACTERISTICS (1-10 scale):`;
    for (const [key, value] of Object.entries(completeToneProfile.toneCharacteristics)) {
      guidance += `
- ${key}: ${value}/10`;
    }
  }

  // Add length preference
  if (completeToneProfile.preferredLength) {
    const lengthGuide = {
      concise: "User prefers concise writing - respect their brevity",
      moderate: "User prefers moderate length - balanced and complete",
      detailed: "User prefers detailed writing - develop ideas thoroughly",
    };
    guidance += `

LENGTH PREFERENCE: ${lengthGuide[completeToneProfile.preferredLength] || completeToneProfile.preferredLength}`;
  }

  // Add avoid topics
  if (completeToneProfile.avoidTopics?.length > 0) {
    guidance += `

TOPICS TO AVOID:
${completeToneProfile.avoidTopics.map(t => `- ${t}`).join("\n")}`;
  }

  // Add emoji/hashtag preferences
  guidance += `

FORMATTING PREFERENCES:
- Emojis: ${completeToneProfile.includeEmojis ? "User allows emojis - use when it fits their voice" : "User doesn't use emojis - never include them"}
- Hashtags: ${completeToneProfile.includeHashtags ? "User uses hashtags - include relevant ones" : "User doesn't use hashtags - don't include them"}`;

  return guidance;
}