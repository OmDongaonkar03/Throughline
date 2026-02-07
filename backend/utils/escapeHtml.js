/**
 * Escape HTML entities to prevent XSS
 * @param {string} unsafe - The unsafe string that may contain HTML
 * @returns {string} - The escaped string safe for HTML insertion
 */
export const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Sanitize user input by removing potentially dangerous content
 * This is for plain text content that should not contain HTML
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize and validate text content (for check-ins, posts, etc.)
 * @param {string} content - Content to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized content
 * @throws {Error} - If content is invalid
 */
export const sanitizeContent = (content, maxLength = 10000) => {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }
  
  // Sanitize input
  let sanitized = sanitizeInput(content);
  
  // Check length after sanitization
  if (sanitized.length === 0) {
    throw new Error('Content cannot be empty after sanitization');
  }
  
  if (sanitized.length > maxLength) {
    throw new Error(`Content exceeds maximum length of ${maxLength} characters`);
  }
  
  return sanitized;
};