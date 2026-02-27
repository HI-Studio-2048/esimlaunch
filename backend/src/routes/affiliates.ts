import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { affiliateService } from '../services/affiliateService';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateSessionOrJWT);

// Validation schemas
const trackReferralSchema = z.object({
  referralCode: z.string().min(1, 'Referral code is required'),
});

/**
 * GET /api/affiliates/code
 * Get affiliate code for current merchant
 */
router.get('/code', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const code = await affiliateService.getOrCreateAffiliateCode(merchantId);

    res.json({
      success: true,
      data: { affiliateCode: code },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to get affiliate code',
    });
  }
});

/**
 * GET /api/affiliates/referral-code
 * Get referral code for current merchant
 */
router.get('/referral-code', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const code = await affiliateService.getOrCreateReferralCode(merchantId);

    res.json({
      success: true,
      data: { referralCode: code },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to get referral code',
    });
  }
});

/**
 * GET /api/affiliates/stats
 * Get affiliate statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const stats = await affiliateService.getAffiliateStats(merchantId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch affiliate stats',
    });
  }
});

/**
 * GET /api/affiliates/commissions
 * Get commissions
 */
router.get('/commissions', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const commissions = await affiliateService.getCommissions(merchantId, {
      status,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: commissions.map(c => ({
        ...c,
        amount: Number(c.amount) / 100,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch commissions',
    });
  }
});

/**
 * POST /api/affiliates/payout-request
 * Request a payout for pending commissions.
 */
router.post('/payout-request', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const stats = await affiliateService.getAffiliateStats(merchantId);

    if (stats.pendingCommissions === 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_PENDING_COMMISSIONS',
        errorMessage: 'No pending commissions to pay out',
      });
    }

    // Mark all pending commissions as paid
    const { prisma } = await import('../lib/prisma');
    await prisma.affiliateCommission.updateMany({
      where: { affiliateId: merchantId, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Payout request submitted. Your commissions have been marked for payout.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'PAYOUT_REQUEST_FAILED',
      errorMessage: error.message || 'Failed to submit payout request',
    });
  }
});

/**
 * POST /api/affiliates/track-referral
 * Track referral (called when merchant signs up with referral code)
 */
router.post('/track-referral', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const data = trackReferralSchema.parse(req.body);

    await affiliateService.trackReferral(merchantId, data.referralCode);

    res.json({
      success: true,
      message: 'Referral tracked successfully',
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
        errorCode: 'TRACKING_FAILED',
        errorMessage: error.message || 'Failed to track referral',
      });
    }
  }
});

export default router;










