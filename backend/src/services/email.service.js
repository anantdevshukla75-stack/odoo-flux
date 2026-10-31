import nodemailer from 'nodemailer';
import env from '../config/environment.js';
import logger from '../utils/logger.js';

let transporterInstance = null;

function getTransporter() {
  if (!transporterInstance) {
    if (env.NODE_ENV === 'test') {
      // Mock transport for tests
      transporterInstance = {
        sendMail: async (mailOptions) => {
          logger.debug({ to: mailOptions.to, subject: mailOptions.subject }, '[Test Mode] Email simulated');
          return { messageId: 'test-message-id' };
        }
      };
    } else {
      transporterInstance = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER && env.SMTP_PASSWORD ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD
        } : undefined
      });
    }
  }
  return transporterInstance;
}

export class EmailService {
  /**
   * Sends a password reset email
   * @param {string} to - Recipient email
   * @param {string} resetToken - Raw unhashed single-use token
   * @param {string} recipientName - Customer name
   */
  static async sendPasswordResetEmail(to, resetToken, recipientName = 'Customer') {
    const resetUrl = `${env.PASSWORD_RESET_URL}?token=${resetToken}&email=${encodeURIComponent(to)}`;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Reset Your Brightloop Software Password',
      text: `Hello ${recipientName},\n\nYou requested a password reset for your Brightloop account.\nClick the link below to set a new password:\n${resetUrl}\n\nThis link will expire in ${env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES} minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b;">Brightloop Software</h2>
          <p>Hello <strong>${recipientName}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">This link will expire in <strong>${env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES} minutes</strong> and can only be used once.</p>
          <p style="color: #64748b; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Brightloop Software. All rights reserved.</p>
        </div>
      `
    };

    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      logger.info({ to, messageId: info.messageId }, 'Password reset email dispatched');
      return info;
    } catch (error) {
      logger.error({ to, err: error.message }, 'Failed to send password reset email');
      // Do not throw fatal error to avoid user enumeration / blocking API response
      return null;
    }
  }

  /**
   * Sends staff invitation / account setup email
   */
  static async sendStaffWelcomeEmail(to, tempPassword, recipientName = 'Staff Member') {
    const loginUrl = `${env.FRONTEND_URL}/login`;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Welcome to Brightloop Software - Staff Portal Access',
      text: `Hello ${recipientName},\n\nYour Brightloop staff account has been created.\nLogin URL: ${loginUrl}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b;">Brightloop Software - Staff Portal</h2>
          <p>Hello <strong>${recipientName}</strong>,</p>
          <p>An administrator has created your staff account for Brightloop Software.</p>
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Temporary Password:</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
          <p style="color: #dc2626; font-size: 14px;"><strong>Important:</strong> Please log in and change your password immediately upon first access.</p>
        </div>
      `
    };

    try {
      const transporter = getTransporter();
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      logger.error({ to, err: error.message }, 'Failed to send staff welcome email');
      return null;
    }
  }
}

export default EmailService;
