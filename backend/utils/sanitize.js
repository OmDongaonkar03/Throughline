import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize text input by removing all HTML tags and attributes
 * Use this for: names, bios, plain text fields
 * 
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text with no HTML
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  return purify.sanitize(text.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize an array of strings
 * Use this for: tags, arrays of topics, string arrays
 * 
 * @param {string[]} array - Array of strings to sanitize
 * @returns {string[]} - Array of sanitized strings
 */
export const sanitizeArray = (array) => {
  if (!Array.isArray(array)) {
    return array;
  }
  
  return array
    .filter(item => typeof item === 'string')
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0); // Remove empty strings after sanitization
};

/**
 * Sanitize HTML content with allowed tags
 * Use this for: rich text fields (if you add them later)
 * 
 * @param {string} html - HTML to sanitize
 * @param {string[]} allowedTags - Array of allowed HTML tags
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html, allowedTags = []) => {
  if (!html || typeof html !== 'string') {
    return html;
  }
  
  return purify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize an object's string values recursively
 * Use this for: complex nested objects
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Object with sanitized string values
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') return sanitizeText(item);
      if (typeof item === 'object') return sanitizeObject(item);
      return item;
    });
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate that sanitized content is not empty
 * Use this after sanitization to ensure user didn't just send HTML/script tags
 * 
 * @param {string} original - Original input
 * @param {string} sanitized - Sanitized output
 * @param {string} fieldName - Name of field for error message
 * @throws {Error} - If sanitized content is empty but original was not
 */
export const validateSanitized = (original, sanitized, fieldName = 'Content') => {
  if (original && original.trim().length > 0 && (!sanitized || sanitized.length === 0)) {
    throw new Error(`${fieldName} cannot be empty after removing unsafe content`);
  }
};