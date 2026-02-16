import { Resend } from 'resend';
import logger from './logger.js';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend with automatic retry logic
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional with Resend)
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise} - Resend response
 */
export async function sendMail({ to, subject, html, text }, maxRetries = 3) {
  if (!process.env.RESEND_API_KEY) {
    logger.error('Email sending failed: RESEND_API_KEY not set');
    throw new Error("RESEND_API_KEY is not set");
  }

  // Validate email domain is configured in Resend
  const fromEmail = process.env.MAIL_FROM || 'Throughline <onboarding@resend.dev>';

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        ...(text && { text }),
      });

      if (error) {
        throw new Error(error.message || 'Resend API error');
      }

      // Success - log and return
      if (attempt > 1) {
        logger.info('Email sent successfully after retries', {
          to,
          subject,
          attempt,
          maxRetries
        });
      } else {
        logger.info('Email sent successfully', {
          to,
          subject
        });
      }

      return data;
    } catch (error) {
      lastError = error;
      
      // Log the attempt
      logger.warn('Email sending attempt failed', {
        attempt,
        maxRetries,
        to,
        subject,
        error: error.message
      });

      if (attempt === maxRetries) {
        logger.error('Email sending failed after all retries', {
          maxRetries,
          to,
          subject,
          error: error.message,
          stack: error.stack
        });
        throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff: wait 1s, 2s, 4s, etc.
      const backoffTime = Math.pow(2, attempt - 1) * 1000;
      logger.debug('Email retry scheduled', {
        attempt,
        backoffMs: backoffTime,
        to,
        subject
      });
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  throw lastError;
}