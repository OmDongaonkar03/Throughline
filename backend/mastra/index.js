import { Mastra } from '@mastra/core/mastra';
import { createToneExtractorAgent } from './agents/prompts/tone-extractor-prompt.js';
import { createDailyGeneratorAgent } from './agents/prompts/daily-prompt.js';
import { createWeeklyGeneratorAgent } from './agents/prompts/weekly-prompt.js';
import { createMonthlyGeneratorAgent } from './agents/prompts/monthly-prompt.js';

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
};

// Tone extraction functions
export { 
  extractToneProfile,
  getToneProfile,
  updateToneProfile,
} from './agents/services/tone-extractor.js';

// Base post generation functions
export {
  generateDailyPost,
  getOrGenerateDailyPost,
} from './agents/services/daily-generator.js';

export {
  generateWeeklyPost,
  getOrGenerateWeeklyPost,
} from './agents/services/weekly-generator.js';

export {
  generateMonthlyPost,
  getOrGenerateMonthlyPost,
} from './agents/services/monthly-generator.js';

// Orchestration functions
export {
  // Complete generation (base posts only)
  generateCompleteDailyPosts,
  generateCompleteWeeklyPosts,
  generateCompleteMonthlyPosts,
  
  // Post operations
  regeneratePost,
  getPostWithVersions,
  
  // Limits
  canUserRegenerate,
  getRegenerationCount,
} from './agents/services/post-orchestrator.js';