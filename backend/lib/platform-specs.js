export const PLATFORM_SPECS = {
  X: {
    name: 'X (Twitter)',
    maxLength: 280,
    style: 'concise, punchy',
    tone: 'casual, direct',
    hashtagLimit: 2,
    features: {
      threads: true,
      emojis: true,
      mentions: true,
    },
  },
  
  LINKEDIN: {
    name: 'LinkedIn',
    maxLength: 3000,
    style: 'professional storytelling',
    tone: 'thoughtful, insightful',
    hashtagLimit: 5,
    features: {
      threads: false,
      emojis: false,
      mentions: true,
    },
  },
  
  REDDIT: {
    name: 'Reddit',
    maxLength: 40000,
    style: 'conversational, detailed',
    tone: 'authentic, helpful',
    hashtagLimit: 0, // Reddit doesn't use hashtags
    features: {
      threads: false,
      emojis: true,
      mentions: false,
    },
  },
};

export function getPlatformSpec(platform) {
  return PLATFORM_SPECS[platform];
}

export function getEnabledPlatforms(settings) {
  const enabled = [];
  if (settings.xEnabled) enabled.push('X');
  if (settings.linkedinEnabled) enabled.push('LINKEDIN');
  if (settings.redditEnabled) enabled.push('REDDIT');
  return enabled;
}