import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { qrCodeService } from './qrCodeService';
import { emailTemplateService } from './emailTemplateService';
import { prisma } from '../lib/prisma';
import { decryptSmtpPassword } from './authService';

const resend = new Resend(env.resendApiKey);

interface MerchantSmtpConfig {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFromName?: string | null;
  smtpFromEmail?: string | null;
}

async function getMerchantSmtp(merchantId: string): Promise<MerchantSmtpConfig | null> {
  try {
    return await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, smtpFromName: true, smtpFromEmail: true },
    });
  } catch {
    return null;
  }
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  merchantSmtp?: MerchantSmtpConfig | null;
}): Promise<void> {
  const { to, subject, html, merchantSmtp } = params;

  if (merchantSmtp?.smtpHost && merchantSmtp.smtpUser && merchantSmtp.smtpPass) {
    let smtpPassword: string;
    try {
      smtpPassword = decryptSmtpPassword(merchantSmtp.smtpPass);
    } catch {
      // Fallback: treat as plaintext for backward compatibility with unencrypted passwords
      smtpPassword = merchantSmtp.smtpPass;
    }
    const transport = nodemailer.createTransport({
      host: merchantSmtp.smtpHost,
      port: merchantSmtp.smtpPort || 587,
      secure: (merchantSmtp.smtpPort || 587) === 465,
      auth: { user: merchantSmtp.smtpUser, pass: smtpPassword },
    });
    const fromName = merchantSmtp.smtpFromName || 'eSIM Launch';
    const fromEmail = merchantSmtp.smtpFromEmail || merchantSmtp.smtpUser;
    await transport.sendMail({ from: `"${fromName}" <${fromEmail}>`, to, subject, html });
    return;
  }

  if (!env.resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return;
  }
  await resend.emails.send({ from: env.resendFromEmail, to, subject, html });
}

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

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail({
    email,
    order,
    packages,
    customerName,
    merchantId,
  }: {
    email: string;
    order: { id: string; totalAmount: number; status: string; createdAt: string };
    packages: Array<{ data?: string; validity?: string; location?: string }>;
    customerName?: string;
    merchantId?: string;
  }): Promise<void> {
    const orderTrackingUrl = `${env.frontendUrl}/order-tracking?orderId=${order.id}`;
    const merchantSmtp = merchantId ? await getMerchantSmtp(merchantId) : null;

    // Try to use merchant's custom template
    if (merchantId) {
      try {
        const template = await emailTemplateService.getTemplate(merchantId, 'order-confirmation');
        if (template) {
          const rendered = emailTemplateService.renderTemplate(template, {
            orderNumber: order.id.substring(0, 8).toUpperCase(),
            customerName: customerName || 'Customer',
            totalAmount: `$${(order.totalAmount / 100).toFixed(2)}`,
            orderDate: new Date(order.createdAt).toLocaleDateString(),
          });
          await sendEmail({ to: email, subject: rendered.subject, html: rendered.htmlBody, merchantSmtp });
          return;
        }
      } catch (templateErr) {
        console.error('Template render failed, falling back to hardcoded HTML:', templateErr);
      }
    }

    const fallbackHtml = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Confirmation</title></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">eSIM Launch</h1>
        </div>
        <div style="background:#fff;padding:40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
          <h2 style="color:#1f2937;margin-top:0;">Order Confirmation</h2>
          <p style="color:#6b7280;">Hello${customerName ? ` ${customerName}` : ''},</p>
          <p style="color:#6b7280;">Thank you for your order! We're processing your eSIM purchase and will send you the QR code shortly.</p>
          <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;font-weight:600;color:#1f2937;">Order Details</p>
            <p style="margin:5px 0;color:#6b7280;font-size:14px;">Order ID: ${order.id.substring(0, 8)}...</p>
            <p style="margin:5px 0;color:#6b7280;font-size:14px;">Total: $${(order.totalAmount / 100).toFixed(2)}</p>
            <p style="margin:5px 0;color:#6b7280;font-size:14px;">Status: ${order.status}</p>
          </div>
          <div style="text-align:center;margin:30px 0;">
            <a href="${orderTrackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:white;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:600;">Track Your Order</a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">© ${new Date().getFullYear()} eSIM Launch. All rights reserved.</p>
        </div>
      </body>
    </html>`;

    try {
      await sendEmail({ to: email, subject: 'Order Confirmation - eSIM Launch', html: fallbackHtml, merchantSmtp });
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      throw new Error('Failed to send order confirmation email');
    }
  },

  // legacy overload keeping old signature
  async _sendOrderConfirmationEmailLegacy({
    email,
    order,
    packages,
    customerName,
  }: {
    email: string;
    order: { id: string; totalAmount: number; status: string; createdAt: string };
    packages: Array<{ data?: string; validity?: string; location?: string }>;
    customerName?: string;
  }): Promise<void> {
    // Just wraps the main method with no merchantId
    return this.sendOrderConfirmationEmail({ email, order, packages, customerName });
  },

  // ---- DEAD CODE kept for build compat (remove in future cleanup) ----
  async _legacyResendOrderConfirm({
    email, order, packages, customerName,
  }: {
    email: string;
    order: { id: string; totalAmount: number; status: string; createdAt: string };
    packages: Array<{ data?: string; validity?: string; location?: string }>;
    customerName?: string;
  }): Promise<void> {
    if (!env.resendApiKey) return;
    const orderTrackingUrl = `${env.frontendUrl}/order-tracking?orderId=${order.id}`;
    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: email,
        subject: 'Order Confirmation - eSIM Launch',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Order Confirmation</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">eSIM Launch</h1>
              </div>
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Order Confirmation</h2>
                <p style="color: #6b7280;">Hello${customerName ? ` ${customerName}` : ''},</p>
                <p style="color: #6b7280;">Thank you for your order! We're processing your eSIM purchase and will send you the QR code shortly.</p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: 600; color: #1f2937;">Order Details</p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Order ID: ${order.id.substring(0, 8)}...</p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Total: $${(order.totalAmount / 100).toFixed(2)}</p>
                  <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Status: ${order.status}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${orderTrackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Your Order</a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">You will receive another email with your eSIM QR code once your order is processed.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} eSIM Launch. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Failed to send order confirmation email (legacy):', error);
    }
  },

  /**
   * Send eSIM delivery email with QR codes
   */
  async sendESIMDeliveryEmail({
    email,
    order,
    qrCodes,
    profiles,
    customerName,
    storeName,
  }: {
    email: string;
    order: { id: string; totalAmount: number; esimAccessOrderNo?: string };
    qrCodes: string[]; // Array of QR code data URLs
    profiles: Array<{
      esimTranNo: string;
      iccid?: string;
      data?: string;
      validity?: string;
      location?: string;
    }>;
    customerName?: string;
    storeName?: string;
  }): Promise<void> {
    const orderTrackingUrl = `${env.frontendUrl}/order-tracking?orderId=${order.id}`;

    // Build QR code images HTML
    const qrCodeImages = qrCodes.map((qrCode, index) => {
      const profile = profiles[index];
      return `
        <div style="margin: 20px 0; text-align: center;">
          <p style="font-weight: 600; margin-bottom: 10px;">eSIM ${index + 1}${profile.data ? ` - ${profile.data}` : ''}</p>
          <img src="${qrCode}" alt="QR Code ${index + 1}" style="max-width: 300px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px; background: white;" />
          ${profile.iccid ? `<p style="font-size: 12px; color: #6b7280; margin-top: 5px;">ICCID: ${profile.iccid}</p>` : ''}
        </div>
      `;
    }).join('');

    try {
      const esimHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your eSIM QR Code</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">${storeName || 'eSIM Launch'}</h1>
              </div>
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Your eSIM is Ready! 📱</h2>
                <p style="color: #6b7280;">Hello${customerName ? ` ${customerName}` : ''},</p>
                <p style="color: #6b7280;">Great news! Your eSIM order has been processed and your QR codes are ready to use.</p>
                
                <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #15803d; margin-top: 0;">How to Install Your eSIM:</h3>
                  <ol style="color: #166534; padding-left: 20px; margin: 10px 0;">
                    <li style="margin: 5px 0;">Open your phone's Settings</li>
                    <li style="margin: 5px 0;">Go to Cellular/Mobile Data</li>
                    <li style="margin: 5px 0;">Tap "Add Cellular Plan" or "Add eSIM"</li>
                    <li style="margin: 5px 0;">Scan the QR code below with your phone's camera</li>
                    <li style="margin: 5px 0;">Follow the on-screen instructions</li>
                  </ol>
                </div>

                ${qrCodeImages}

                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Important:</strong> Your eSIM will activate automatically when you arrive at your destination and connect to a local network. We recommend installing it before you travel.
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${orderTrackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Order Details</a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Need help? Check out our <a href="${env.frontendUrl}/demo-store/esim-setup-guide" style="color: #6366f1;">setup guide</a> or contact support.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${storeName || 'eSIM Launch'}. All rights reserved.</p>
              </div>
            </body>
          </html>`;
      await sendEmail({ to: email, subject: 'Your eSIM is Ready! - QR Code Delivery', html: esimHtml });
    } catch (error) {
      console.error('Failed to send eSIM delivery email:', error);
      throw new Error('Failed to send eSIM delivery email');
    }
  },

  /**
   * Resend eSIM delivery email by re-triggering deliverESIMs via webhookService.
   * This is a convenience wrapper — the actual send logic lives in deliverESIMs.
   */
  async resendESIMEmail(orderId: string): Promise<void> {
    // Import lazily to avoid circular dependency
    const { webhookService } = await import('./webhookService');
    await webhookService.deliverESIMs(orderId);
  },

  /**
   * Send ticket confirmation email to customer
   */
  async sendTicketConfirmationEmail(
    customerEmail: string,
    ticketNumber: string,
    subject: string
  ): Promise<void> {
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: customerEmail,
        subject: `Support Ticket Created: ${ticketNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Support Ticket Created</h2>
            <p>Thank you for contacting us. We've received your support request and will get back to you soon.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            <p>You can track your ticket status and add additional information by replying to this email.</p>
            <p>Best regards,<br>eSIM Launch Support Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send ticket confirmation email:', error);
      throw error;
    }
  },

  /**
   * Send ticket notification email to merchant
   */
  async sendTicketNotificationEmail(
    merchantEmail: string,
    ticketNumber: string,
    subject: string,
    customerEmail: string
  ): Promise<void> {
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: merchantEmail,
        subject: `New Support Ticket: ${ticketNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Support Ticket</h2>
            <p>A new support ticket has been created for your store.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Customer:</strong> ${customerEmail}</p>
            </div>
            <p><a href="${env.frontendUrl}/dashboard/support/tickets/${ticketNumber}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a></p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send ticket notification email:', error);
      throw error;
    }
  },

  /**
   * Send ticket reply email to customer
   */
  async sendTicketReplyEmail(
    customerEmail: string,
    ticketNumber: string,
    message: string,
    senderName: string
  ): Promise<void> {
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: customerEmail,
        subject: `Re: Support Ticket ${ticketNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Reply to Your Support Ticket</h2>
            <p>You have received a new reply to your support ticket <strong>${ticketNumber}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>From:</strong> ${senderName}</p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>You can reply to this email to add more information to your ticket.</p>
            <p>Best regards,<br>eSIM Launch Support Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send ticket reply email:', error);
      throw error;
    }
  },

  /**
   * Send ticket reply notification to merchant
   */
  async sendTicketReplyNotificationEmail(
    merchantEmail: string,
    ticketNumber: string,
    message: string,
    customerEmail: string
  ): Promise<void> {
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return;
    }

    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: merchantEmail,
        subject: `New Reply to Ticket ${ticketNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Customer Reply</h2>
            <p>A customer has replied to support ticket <strong>${ticketNumber}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>From:</strong> ${customerEmail}</p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p><a href="${env.frontendUrl}/dashboard/support/tickets/${ticketNumber}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Ticket</a></p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send ticket reply notification email:', error);
      throw error;
    }
  },

  /**
   * Send a notification to the admin email (admin@esimlaunch.com).
   * Used for new store requests, etc.
   */
  async sendAdminNotification(params: { subject: string; html: string }): Promise<void> {
    const { subject, html } = params;
    if (!env.adminEmail) {
      console.warn('ADMIN_EMAIL not configured, skipping admin notification');
      return;
    }
    if (!env.resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping admin notification');
      return;
    }
    try {
      await resend.emails.send({
        from: env.resendFromEmail,
        to: env.adminEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  },
};

