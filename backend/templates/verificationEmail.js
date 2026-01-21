import { escapeHtml } from "../utils/escapeHtml.js";

export const verificationEmailTemplate = ({ name, verificationLink }) => {
  const safeName = escapeHtml(name);
  
  return {
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                      Verify your email address
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 24px;">
                      Hi ${safeName},
                    </p>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px; line-height: 24px;">
                      Thanks for signing up with Throughline! To complete your registration and start using your account, please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 6px; background-color: #111827;">
                          <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 6px;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                      This link will expire in 15 minutes. If you didn't create an account with Throughline, you can safely ignore this email.
                    </p>
                    
                    <!-- Alternative link -->
                    <p style="margin: 20px 0 0; color: #9ca3af; font-size: 13px; line-height: 18px;">
                      If the button doesn't work, copy and paste this link into your browser:
                      <br>
                      <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">${verificationLink}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 18px; text-align: center;">
                      © ${new Date().getFullYear()} Throughline. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
      Hi ${safeName},
      
      Thanks for signing up with Throughline! To complete your registration and start using your account, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 15 minutes. If you didn't create an account with Throughline, you can safely ignore this email.
      
      © ${new Date().getFullYear()} Throughline. All rights reserved.
    `
  };
};