import express from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  serviceType: z.enum(['EASY', 'ADVANCED']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new merchant
 */
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
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
 * Login merchant
 */
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
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
 * Get current merchant info (requires JWT auth)
 */
router.get('/me', authenticateJWT, async (req, res, next) => {
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

router.post('/forgot-password', async (req, res, next) => {
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
router.post('/refresh', authenticateJWT, async (req, res, next) => {
  try {
    // If we get here, the token is valid (authenticateJWT passed)
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
});

router.put('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const merchant = await authService.updateProfile(req.merchant!.id, data);
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

router.put('/change-password', authenticateJWT, async (req, res, next) => {
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
router.delete('/account', authenticateJWT, async (req, res, next) => {
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
  clerkUserId: z.string().min(1, 'Clerk user ID is required'),
});

router.post('/clerk-sync', async (req, res, next) => {
  try {
    const data = clerkSyncSchema.parse(req.body);
    const { clerkService } = await import('../services/clerkService');
    
    // Sync or create merchant from Clerk user
    const merchant = await clerkService.getOrCreateMerchantFromClerk(data.clerkUserId);
    
    // Generate JWT token
    const token = authService.generateToken(merchant.id);
    
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
      res.status(400).json({
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
    // TODO: Verify webhook signature from Clerk
    const { type, data } = req.body;
    
    const { clerkService } = await import('../services/clerkService');
    
    if (type === 'user.created' || type === 'user.updated') {
      const clerkUserId = data.id;
      const email = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name;
      const lastName = data.last_name;
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName;
      
      if (email) {
        await clerkService.syncClerkUser(clerkUserId, email, name);
      }
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Clerk webhook error:', error);
    res.status(400).json({
      success: false,
      errorCode: 'WEBHOOK_FAILED',
      errorMessage: error.message || 'Failed to process webhook',
    });
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
router.post('/resend-verification', authenticateJWT, async (req, res, next) => {
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
router.post('/2fa/setup', authenticateJWT, async (req, res, next) => {
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

router.post('/2fa/verify', authenticateJWT, async (req, res, next) => {
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
router.post('/2fa/disable', authenticateJWT, async (req, res, next) => {
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
router.get('/2fa/status', authenticateJWT, async (req, res, next) => {
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

router.post('/2fa/login', authenticateJWT, async (req, res, next) => {
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

    res.json({
      success: true,
      message: '2FA verified successfully',
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
 * GET /api/auth/sessions
 * Get all active sessions for the merchant (requires JWT auth)
 */
router.get('/sessions', authenticateJWT, async (req, res, next) => {
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
router.delete('/sessions/:id', authenticateJWT, async (req, res, next) => {
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
router.delete('/sessions', authenticateJWT, async (req, res, next) => {
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

export default router;

