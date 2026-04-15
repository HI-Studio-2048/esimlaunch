import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { authService, decryptSmtpPassword } from '../services/authService';
import { authenticateJWT, authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { sessionService } from '../services/sessionService';
import { SESSION_COOKIE_NAME } from '../middleware/sessionAuth';
import { emailService } from '../services/emailService';
import { env } from '../config/env';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes per IP
  message: { success: false, errorCode: 'RATE_LIMIT', errorMessage: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const twoFactorLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per 5 minutes per IP
  message: { success: false, errorCode: 'RATE_LIMIT', errorMessage: 'Too many 2FA attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const SESSION_DAYS = 7;
function setSessionCookie(res: express.Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res: express.Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/', httpOnly: true });
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  serviceType: z.enum(['EASY', 'ADVANCED']).optional(),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new merchant. Creates DB session and sets httpOnly cookie.
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    // Track referral if provided
    let referralStatus: 'tracked' | 'invalid' | 'self' | null = null;
    if (data.referralCode) {
      try {
        const { affiliateService } = await import('../services/affiliateService');
        await affiliateService.trackReferral(result.merchant.id, data.referralCode);
        referralStatus = 'tracked';
      } catch (refErr: any) {
        const msg = String(refErr?.message || '');
        referralStatus = msg.includes('Self-referral') ? 'self' : 'invalid';
        console.warn('Referral tracking failed:', msg);
      }
    }
    // Notify admin of new merchant signup (fire-and-forget)
    emailService.sendAdminNotification({
      subject: `[eSIMLaunch] New merchant signed up: ${result.merchant.email}`,
      html: `
        <p>A new merchant has registered on eSIMLaunch.</p>
        <ul>
          <li><strong>Email:</strong> ${result.merchant.email}</li>
          <li><strong>Name:</strong> ${result.merchant.name || '—'}</li>
          <li><strong>Plan type:</strong> ${result.merchant.serviceType}</li>
          <li><strong>Merchant ID:</strong> ${result.merchant.id}</li>
          <li><strong>Signed up:</strong> ${new Date().toISOString()}</li>
        </ul>
        <p>View in the <a href="${env.frontendUrl}/admin">Admin dashboard</a>.</p>
      `,
    }).catch((err) => console.error('Admin notification (new merchant) failed:', err));
    const session = await sessionService.createSession(
      result.merchant.id,
      req.ip,
      req.get('user-agent'),
      SESSION_DAYS
    );
    setSessionCookie(res, session.token);
    res.json({
      success: true,
      data: { ...result, referralStatus },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: 'REGISTRATION_FAILED',
        errorMessage: error.message || 'Registration failed',
      });
    }
  }
});

/**
 * POST /api/auth/login
 * Login merchant. Creates DB session and sets httpOnly cookie so auth works across devices (no localStorage).
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    // Check if 2FA is enabled
    if (result.merchant.twoFactorEnabled) {
      // Return a limited-scope token that only allows 2FA verification
      const limitedToken = jwt.sign(
        { merchantId: result.merchant.id, scope: 'pre_2fa' },
        env.jwtSecret,
        { expiresIn: '5m' }
      );
      // Don't create a session yet — wait for 2FA verification
      return res.json({
        success: true,
        data: {
          requires2FA: true,
          token: limitedToken,
          merchant: { id: result.merchant.id, email: result.merchant.email },
        },
      });
    }

    const session = await sessionService.createSession(
      result.merchant.id,
      req.ip,
      req.get('user-agent'),
      SESSION_DAYS
    );
    setSessionCookie(res, session.token);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(401).json({
        success: false,
        errorCode: 'LOGIN_FAILED',
        errorMessage: error.message || 'Invalid credentials',
      });
    }
  }
});

/**
 * GET /api/auth/me
 * Get current merchant. Accepts session cookie or JWT (DB-backed session works on any device).
 */
router.get('/me', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const merchant = await authService.getMerchantById(req.merchant!.id);
    res.json({
      success: true,
      data: merchant,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      errorCode: 'MERCHANT_NOT_FOUND',
      errorMessage: error.message,
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(data.email);
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        errorCode: 'FORGOT_PASSWORD_FAILED',
        errorMessage: error.message || 'Failed to process password reset request',
      });
    }
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify reset token validity
 */
router.get('/verify-reset-token/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const isValid = await authService.verifyResetToken(token);
    res.json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'TOKEN_VERIFICATION_FAILED',
      errorMessage: error.message || 'Failed to verify token',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(data.token, data.password);
    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: 'RESET_PASSWORD_FAILED',
        errorMessage: error.message || 'Failed to reset password',
      });
    }
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    // If we get here, session or JWT is valid
    // Generate a new token for the merchant
    const merchant = await authService.getMerchantById(req.merchant!.id);
    const newToken = authService.generateToken(merchant.id);
    
    res.json({
      success: true,
      data: {
        token: newToken,
        merchant,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      errorCode: 'REFRESH_FAILED',
      errorMessage: error.message || 'Failed to refresh token',
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update merchant profile
 */
const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  serviceType: z.enum(['EASY', 'ADVANCED']).optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFromName: z.string().optional(),
  smtpFromEmail: z.string().email().optional().or(z.literal('')),
});

router.put('/profile', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const merchant = await authService.updateProfile(req.merchant!.id, {
      name: data.name,
      email: data.email,
      serviceType: data.serviceType as any,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUser: data.smtpUser,
      smtpPass: data.smtpPass,
      smtpFromName: data.smtpFromName,
      smtpFromEmail: data.smtpFromEmail,
    });
    res.json({
      success: true,
      data: merchant,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: 'UPDATE_PROFILE_FAILED',
        errorMessage: error.message || 'Failed to update profile',
      });
    }
  }
});

/**
 * PUT /api/auth/change-password
 * Change password
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

router.put('/change-password', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.merchant!.id, data.currentPassword, data.newPassword);
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: 'CHANGE_PASSWORD_FAILED',
        errorMessage: error.message || 'Failed to change password',
      });
    }
  }
});

/**
 * DELETE /api/auth/account
 * Delete merchant account (soft delete)
 */
router.delete('/account', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    await authService.deleteAccount(req.merchant!.id);
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'DELETE_ACCOUNT_FAILED',
      errorMessage: error.message || 'Failed to delete account',
    });
  }
});

/**
 * POST /api/auth/clerk-sync
 * Sync Clerk user to merchant account and get JWT token
 */
const clerkSyncSchema = z.object({
  sessionToken: z.string().min(1, 'Clerk session token is required'),
  referralCode: z.string().min(1).max(32).optional(),
});

router.post('/clerk-sync', async (req, res, next) => {
  try {
    const data = clerkSyncSchema.parse(req.body);
    const { clerkService } = await import('../services/clerkService');

    // Verify the session token to get the real Clerk user ID
    const clerkUserId = await clerkService.verifySessionToken(data.sessionToken);

    const merchant = await clerkService.getOrCreateMerchantFromClerk(clerkUserId, data.referralCode);
    const token = authService.generateToken(merchant.id);
    
    // Create DB session and set cookie (same as login — no localStorage)
    const session = await sessionService.createSession(
      merchant.id,
      req.ip,
      req.get('user-agent'),
      SESSION_DAYS
    );
    setSessionCookie(res, session.token);
    
    res.json({
      success: true,
      data: {
        merchant,
        token,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(401).json({
        success: false,
        errorCode: 'CLERK_SYNC_FAILED',
        errorMessage: error.message || 'Failed to sync Clerk user',
      });
    }
  }
});

/**
 * POST /api/auth/clerk-webhook
 * Webhook endpoint for Clerk events
 */
router.post('/clerk-webhook', async (req, res, next) => {
  try {
    const { Webhook } = await import('svix');

    if (!env.clerkWebhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ success: false, errorCode: 'CONFIG_ERROR', errorMessage: 'Webhook secret not configured' });
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      return res.status(400).json({ success: false, errorCode: 'MISSING_BODY', errorMessage: 'Missing raw request body' });
    }

    const wh = new Webhook(env.clerkWebhookSecret);
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    let event: any;
    try {
      event = wh.verify(rawBody.toString(), headers);
    } catch (err) {
      console.error('Clerk webhook signature verification failed');
      return res.status(401).json({ success: false, errorCode: 'INVALID_SIGNATURE', errorMessage: 'Webhook signature verification failed' });
    }

    const { clerkService } = await import('../services/clerkService');

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const clerkUserId = event.data.id;
      const email = event.data.email_addresses?.[0]?.email_address;
      const firstName = event.data.first_name;
      const lastName = event.data.last_name;
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName;

      if (email) {
        await clerkService.syncClerkUser(clerkUserId, email, name);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Clerk webhook error:', error?.message);
    res.status(400).json({ success: false, errorCode: 'WEBHOOK_FAILED', errorMessage: error.message || 'Failed to process webhook' });
  }
});

/**
 * POST /api/auth/verify-email/:token
 * Verify email address
 */
router.post('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);
    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'VERIFICATION_FAILED',
      errorMessage: error.message || 'Failed to verify email',
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email (requires JWT auth)
 */
router.post('/resend-verification', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    await authService.resendVerificationEmail(req.merchant!.id);
    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'RESEND_VERIFICATION_FAILED',
      errorMessage: error.message || 'Failed to resend verification email',
    });
  }
});

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA secret and QR code (requires JWT auth)
 */
router.post('/2fa/setup', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { twoFactorService } = await import('../services/twoFactorService');
    const merchant = await authService.getMerchantById(req.merchant!.id);
    const result = await twoFactorService.generateSecret(merchant.id, merchant.email);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: '2FA_SETUP_FAILED',
      errorMessage: error.message || 'Failed to setup 2FA',
    });
  }
});

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA setup token (requires JWT auth)
 */
const verify2FASetupSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

router.post('/2fa/verify', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const data = verify2FASetupSchema.parse(req.body);
    const { twoFactorService } = await import('../services/twoFactorService');
    const isValid = await twoFactorService.verifySetupToken(req.merchant!.id, data.token);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        errorMessage: 'Invalid verification code',
      });
    }

    // Enable 2FA
    await twoFactorService.enable(req.merchant!.id);
    
    res.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: '2FA_VERIFY_FAILED',
        errorMessage: error.message || 'Failed to verify 2FA',
      });
    }
  }
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA (requires JWT auth)
 */
router.post('/2fa/disable', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { twoFactorService } = await import('../services/twoFactorService');
    await twoFactorService.disable(req.merchant!.id);
    res.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: '2FA_DISABLE_FAILED',
      errorMessage: error.message || 'Failed to disable 2FA',
    });
  }
});

/**
 * GET /api/auth/2fa/status
 * Get 2FA status (requires JWT auth)
 */
router.get('/2fa/status', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { twoFactorService } = await import('../services/twoFactorService');
    const isEnabled = await twoFactorService.isEnabled(req.merchant!.id);
    res.json({
      success: true,
      data: { enabled: isEnabled },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: '2FA_STATUS_FAILED',
      errorMessage: error.message || 'Failed to get 2FA status',
    });
  }
});

/**
 * POST /api/auth/2fa/login
 * Verify 2FA token during login (requires JWT auth - for login flow)
 */
const verify2FALoginSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

router.post('/2fa/login', twoFactorLimiter, authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const data = verify2FALoginSchema.parse(req.body);
    const { twoFactorService } = await import('../services/twoFactorService');
    const isValid = await twoFactorService.verifyToken(req.merchant!.id, data.token);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_2FA_TOKEN',
        errorMessage: 'Invalid 2FA code',
      });
    }

    // 2FA verified — now create session and return full merchant data
    const merchant = await authService.getMerchantById(req.merchant!.id);
    const fullToken = authService.generateToken(req.merchant!.id);
    const session = await sessionService.createSession(
      req.merchant!.id,
      req.ip,
      req.get('user-agent'),
      SESSION_DAYS
    );
    setSessionCookie(res, session.token);

    res.json({
      success: true,
      message: '2FA verified successfully',
      data: {
        merchant,
        token: fullToken,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: '2FA_LOGIN_FAILED',
        errorMessage: error.message || 'Failed to verify 2FA',
      });
    }
  }
});

/**
 * POST /api/auth/logout
 * Log out: delete DB session and clear session cookie (no localStorage).
 */
router.post('/logout', async (req, res) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) {
      await sessionService.deleteSession(match[1].trim());
    }
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

/**
 * GET /api/auth/sessions
 * Get all active sessions for the merchant (requires JWT auth)
 */
router.get('/sessions', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { sessionService } = await import('../services/sessionService');
    const sessions = await sessionService.getMerchantSessions(req.merchant!.id);
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'GET_SESSIONS_FAILED',
      errorMessage: error.message || 'Failed to get sessions',
    });
  }
});

/**
 * DELETE /api/auth/sessions/:id
 * Delete a specific session (requires JWT auth)
 */
router.delete('/sessions/:id', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sessionService } = await import('../services/sessionService');
    await sessionService.deleteSessionById(req.merchant!.id, id);
    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'DELETE_SESSION_FAILED',
      errorMessage: error.message || 'Failed to delete session',
    });
  }
});

/**
 * DELETE /api/auth/sessions
 * Delete all sessions except current (requires JWT auth)
 */
router.delete('/sessions', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { sessionService } = await import('../services/sessionService');
    // Get current session token from JWT (we'd need to track this)
    // For now, delete all sessions and let user re-login
    await sessionService.deleteAllMerchantSessions(req.merchant!.id);
    res.json({
      success: true,
      message: 'All sessions deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      errorCode: 'DELETE_SESSIONS_FAILED',
      errorMessage: error.message || 'Failed to delete sessions',
    });
  }
});

/**
 * POST /api/auth/test-email
 * Send a test email using the merchant's SMTP settings (or Resend if no SMTP).
 */
router.post('/test-email', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const merchantId = req.merchant!.id;

    const nodemailer = await import('nodemailer');
    const { env } = await import('../config/env');
    const { Resend } = await import('resend');
    const { prisma } = await import('../lib/prisma');

    const smtp = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, smtpFromName: true, smtpFromEmail: true },
    });
    let sent = false;

    if (smtp?.smtpHost && smtp.smtpUser && smtp.smtpPass) {
      const decryptedPass = decryptSmtpPassword(smtp.smtpPass);
      const transport = nodemailer.default.createTransport({
        host: smtp.smtpHost,
        port: smtp.smtpPort || 587,
        secure: (smtp.smtpPort || 587) === 465,
        auth: { user: smtp.smtpUser, pass: decryptedPass },
      });
      await transport.sendMail({
        from: `"${smtp?.smtpFromName || 'eSIM Launch'}" <${smtp?.smtpFromEmail || smtp?.smtpUser}>`,
        to: email,
        subject: 'Test Email - eSIM Launch',
        html: '<p>This is a test email from your eSIM Launch SMTP configuration. It works!</p>',
      });
      sent = true;
    }

    if (!sent) {
      if (!env.resendApiKey) {
        return res.status(400).json({
          success: false,
          errorCode: 'NO_EMAIL_CONFIG',
          errorMessage: 'No SMTP or Resend configuration found. Please configure SMTP settings first.',
        });
      }
      const resend = new Resend(env.resendApiKey);
      await resend.emails.send({
        from: env.resendFromEmail,
        to: email,
        subject: 'Test Email - eSIM Launch',
        html: '<p>This is a test email from eSIM Launch. Your email configuration is working!</p>',
      });
    }

    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', errorMessage: error.errors[0].message });
    }
    res.status(500).json({ success: false, errorCode: 'TEST_EMAIL_FAILED', errorMessage: error.message || 'Failed to send test email' });
  }
});

export default router;

