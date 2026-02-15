import helmet from 'helmet';

// Create a middleware that sets various HTTP security headers
export const securityHeaders = helmet({

  // Content Security Policy (CSP)
  // Controls which resources the browser is allowed to load.
  // Helps prevent XSS, data injection, and malicious resource loading.
  contentSecurityPolicy: {
    directives: {

      // Default rule for all resource types not explicitly defined below.
      // 'self' = only allow resources from the same origin (your domain).
      defaultSrc: ["'self'"],

      // Controls where CSS can be loaded from.
      // 'unsafe-inline' allows inline <style> tags (not ideal, but sometimes required).
      styleSrc: ["'self'", "'unsafe-inline'"],

      // Controls allowed JavaScript sources.
      // Only scripts from your own domain are allowed.
      scriptSrc: ["'self'"],

      // Controls image sources.
      // Allows:
      // - same origin
      // - base64 images (data:)
      // - any HTTPS image (e.g., CDN, external APIs)
      imgSrc: ["'self'", "data:", "https:"],

      // Controls where the app can make fetch/XHR/WebSocket requests.
      // Only your own backend is allowed.
      connectSrc: ["'self'"],

      // Controls font loading sources.
      fontSrc: ["'self'"],

      // Disallows plugins like Flash, PDF embeds via <object>.
      // 'none' = completely blocked.
      objectSrc: ["'none'"],

      // Controls audio and video sources.
      mediaSrc: ["'self'"],

      // Controls iframe embedding.
      // 'none' = your site cannot embed external sites via <iframe>.
      frameSrc: ["'none'"],
    },
  },

  // HTTP Strict Transport Security (HSTS)
  // Forces browsers to use HTTPS for your domain.
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true, // Apply to all subdomains
    preload: true // Allow domain to be included in browser preload lists
  },

  // Prevents MIME type sniffing.
  // Stops browsers from guessing file types (reduces certain attack vectors).
  noSniff: true,

  // Enables basic XSS protection in older browsers.
  // Modern browsers rely more on CSP than this header.
  xssFilter: true,

  // Removes the "X-Powered-By" header (e.g., Express).
  // Prevents attackers from knowing your tech stack.
  hidePoweredBy: true,
});
