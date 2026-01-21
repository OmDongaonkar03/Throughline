/**
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