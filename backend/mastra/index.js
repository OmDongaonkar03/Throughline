import { Mastra } from '@mastra/core/mastra';
import { createToneExtractorAgent } from './agents/tone-extractor.js';
import { createDailyGeneratorAgent } from './agents/daily-generator.js';
import { createWeeklyGeneratorAgent } from './agents/weekly-generator.js';
import { createMonthlyGeneratorAgent } from './agents/monthly-generator.js';
import { createPlatformAdapterAgent } from './agents/platform-adapter.js';

// Initialize Mastra with all agents
export const mastra = new Mastra({
  agents: {
    // Tone extractor doesn't need user context at registration
    toneExtractor: createToneExtractorAgent(),
    // Other agents are created on-demand with user's tone profile
  },
});

// Agent creation functions
export { 
  createToneExtractorAgent,
  createDailyGeneratorAgent,
  createWeeklyGeneratorAgent,
  createMonthlyGeneratorAgent,
  createPlatformAdapterAgent,
};

// Tone extraction functions
export { 
  extractToneProfile,
  getToneProfile,
  updateToneProfile,
} from './agents/tone-extractor.js';

// Base post generation functions
export {
  generateDailyPost,
  getOrGenerateDailyPost,
} from './agents/daily-generator.js';

export {
  generateWeeklyPost,
  getOrGenerateWeeklyPost,
} from './agents/weekly-generator.js';

export {
  generateMonthlyPost,
  getOrGenerateMonthlyPost,
} from './agents/monthly-generator.js';

// Platform adaptation functions
export {
  adaptForPlatform,
} from './agents/platform-adapter.js';

// Orchestration functions
export {
  // Complete generation (base + platforms)
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
  
  // Platform-specific operations
  generatePlatformPosts,
  regeneratePlatformPosts,
  
  // Retrieval
  getPostsWithPlatforms,
  
  // Limits
  canUserRegenerate,
  getRegenerationCount,
} from './agents/post-orchestrator.js';