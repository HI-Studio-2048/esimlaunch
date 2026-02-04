import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resendApiKey);

interface SendPasswordResetEmailParams {
  email: string;
  resetToken: string;
  name?: string;
}

export const emailService = {
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ email, resetToken, name }: SendPasswordResetEmailParams): Promise<void> {
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: email,
        subject: 'Reset Your Password - eSIM Launch',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">eSIM Launch</h1>
              </div>
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
                <p style="color: #6b7280;">Hello${name ? ` ${name}` : ''},</p>
                <p style="color: #6b7280;">We received a request to reset your password for your eSIM Launch account. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${resetUrl}</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} eSIM Launch. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  },

  /**
   * Send email verification email
   */
  async sendVerificationEmail({ email, verificationToken, name }: { email: string; verificationToken: string; name?: string }): Promise<void> {
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    const verificationUrl = `${env.frontendUrl}/verify-email?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: email,
        subject: 'Verify Your Email - eSIM Launch',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">eSIM Launch</h1>
              </div>
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
                <p style="color: #6b7280;">Hello${name ? ` ${name}` : ''},</p>
                <p style="color: #6b7280;">Thank you for signing up! Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} eSIM Launch. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  },
};

