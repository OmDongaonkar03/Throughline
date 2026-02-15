/**
 * Parse structured response with labeled sections
 * @param {string} text - Full response text
 * @param {string[]} labels - Labels to split on (e.g., ['THEMES', 'HIGHLIGHTS'])
 * @returns {Object} Parsed sections with narrative and labeled data
 */
export function parseStructuredResponse(text, labels) {
  const fullText = text.trim();
  
  // Create regex pattern from labels
  const pattern = new RegExp(labels.map(l => `${l}:`).join('|'));
  
  // Split on all labels
  const parts = fullText.split(pattern);
  
  // First part is always the narrative
  const narrative = parts[0].trim();
  
  // Parse each labeled section
  const parsed = { narrative };
  
  labels.forEach((label, index) => {
    const content = parts[index + 1]?.trim();
    
    if (!content) {
      parsed[label.toLowerCase()] = [];
      return;
    }
    
    // Check if this should be a single string or array
    // (for labels like 'evolution', 'momentum')
    if (content.includes(',')) {
      parsed[label.toLowerCase()] = content
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    } else {
      // Single value, don't split
      parsed[label.toLowerCase()] = content;
    }
  });
  
  return parsed;
}

/**
 * Parse comma-separated list
 * @param {string} text - Text to parse
 * @returns {string[]} Array of trimmed items
 */
export function parseCommaSeparated(text) {
  if (!text) return [];
  
  return text
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}