import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.MAIL_USER, // gmail address
    pass: process.env.MAIL_PASS, // password
  },
});

/**
 * Send email with automatic retry logic
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise} - Nodemailer response
 */
export async function sendMail({ to, subject, html, text }, maxRetries = 3) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("MAIL_USER or MAIL_PASS is not set");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || `"Throughline" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      // Success - log and return
      if (attempt > 1) {
        console.log(`[Email] Successfully sent after ${attempt} attempts to ${to}`);
      }

      return info;
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