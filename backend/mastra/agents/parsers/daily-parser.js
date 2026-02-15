import { parseStructuredResponse } from './base-parser.js';

/**
 * Parse daily post generation response
 * @param {string} responseText - Full response from agent
 * @returns {Object} Parsed daily post with narrative and metadata
 */
export function parseDailyPostResponse(responseText) {
  const labels = ['THEMES', 'HIGHLIGHTS', 'INSIGHTS'];
  const parsed = parseStructuredResponse(responseText, labels);
  
  return {
    narrative: parsed.narrative,
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
  };
}