import { Resend } from 'resend';

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
        console.log(`[Email] Successfully sent after ${attempt} attempts to ${to}`);
      }

      return data;
    } catch (error) {
      lastError = error;
      
      // Log the attempt
      console.error(`[Email] Attempt ${attempt}/${maxRetries} failed for ${to}:`, error.message);

      if (attempt === maxRetries) {
        console.error(`[Email] All ${maxRetries} attempts failed for ${to}`);
        throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff: wait 1s, 2s, 4s, etc.
      const backoffTime = Math.pow(2, attempt - 1) * 1000;
      console.log(`[Email] Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }

  throw lastError;
}