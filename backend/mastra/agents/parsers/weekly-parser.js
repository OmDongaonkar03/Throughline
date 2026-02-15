import { parseStructuredResponse } from './base-parser.js';

/**
 * Parse weekly post generation response
 * @param {string} responseText - Full response from agent
 * @returns {Object} Parsed weekly post with narrative and metadata
 */
export function parseWeeklyPostResponse(responseText) {
  const labels = ['THEMES', 'HIGHLIGHTS', 'PATTERNS', 'EVOLUTION'];
  const parsed = parseStructuredResponse(responseText, labels);
  
  return {
    narrative: parsed.narrative,
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
    evolution: typeof parsed.evolution === 'string' ? parsed.evolution : '',
  };
}