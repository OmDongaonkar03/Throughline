import { parseStructuredResponse } from './base-parser.js';

/**
 * Parse monthly post generation response
 * @param {string} responseText - Full response from agent
 * @returns {Object} Parsed monthly post with narrative and metadata
 */
export function parseMonthlyPostResponse(responseText) {
  const labels = ['THEMES', 'ACHIEVEMENTS', 'SHIFTS', 'MOMENTUM', 'NEXT_FOCUS'];
  const parsed = parseStructuredResponse(responseText, labels);
  
  return {
    narrative: parsed.narrative,
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
    momentum: typeof parsed.momentum === 'string' ? parsed.momentum : '',
    nextFocus: Array.isArray(parsed.next_focus) ? parsed.next_focus : [],
  };
}