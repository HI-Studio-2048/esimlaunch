import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { subscriptionService } from '../services/subscriptionService';
import { emailService } from '../services/emailService';
import { env } from '../config/env';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateSessionOrJWT);

// Validation schemas
const createSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale', 'test', 'api_only']),
  billingPeriod: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale', 'test']),
  billingPeriod: z.enum(['monthly', 'yearly']).optional(),
});

/**
 * GET /api/subscriptions/me
 * Get current subscription
 */
router.get('/me', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const subscription = await subscriptionService.getSubscription(merchantId);

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        ...subscription,
        invoices: subscription.invoices.map(inv => ({
          ...inv,
          amount: Number(inv.amount) / 100, // Convert from cents
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch subscription',
    });
  }
});

/**
 * POST /api/subscriptions
 * Create subscription
 */
router.post('/', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const data = createSubscriptionSchema.parse(req.body);

    const subscription = await subscriptionService.createSubscription({
      merchantId,
      plan: data.plan,
      billingPeriod: data.billingPeriod,
      paymentMethodId: data.paymentMethodId,
    });

    res.json({
      success: true,
      data: subscription,
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
        errorCode: 'SUBSCRIPTION_CREATION_FAILED',
        errorMessage: error.message || 'Failed to create subscription',
      });
    }
  }
});

/**
 * PUT /api/subscriptions/me
 * Update subscription (upgrade/downgrade)
 */
router.put('/me', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const data = updateSubscriptionSchema.parse(req.body);

    const subscription = await subscriptionService.updateSubscription(
      merchantId,
      data.plan,
      data.billingPeriod
    );

    res.json({
      success: true,
      data: subscription,
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
        errorCode: 'SUBSCRIPTION_UPDATE_FAILED',
        errorMessage: error.message || 'Failed to update subscription',
      });
    }
  }
});

/**
 * DELETE /api/subscriptions/me
 * Cancel subscription
 */
router.delete('/me', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { cancelImmediately } = z.object({
      cancelImmediately: z.boolean().default(false),
    }).parse(req.query);

    const subscription = await subscriptionService.cancelSubscription(
      merchantId,
      cancelImmediately
    );

    // Notify admin of cancellation (fire-and-forget)
    emailService.sendAdminNotification({
      subject: `[eSIMLaunch] Subscription canceled by merchant ${(req as any).merchant!.email}`,
      html: `
        <p>A merchant has canceled their subscription.</p>
        <ul>
          <li><strong>Merchant:</strong> ${(req as any).merchant!.email}</li>
          <li><strong>Merchant ID:</strong> ${merchantId}</li>
          <li><strong>Immediate:</strong> ${cancelImmediately ? 'Yes' : 'No (at period end)'}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>
        <p>View in the <a href="${env.frontendUrl}/admin">Admin dashboard</a>.</p>
      `,
    }).catch((err) => console.error('Admin notification (subscription cancel) failed:', err));

    res.json({
      success: true,
      data: subscription,
      message: cancelImmediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'SUBSCRIPTION_CANCEL_FAILED',
      errorMessage: error.message || 'Failed to cancel subscription',
    });
  }
});

/**
 * GET /api/subscriptions/invoices
 * Get invoice history
 */
router.get('/invoices', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const invoices = await subscriptionService.getInvoices(merchantId);

    res.json({
      success: true,
      data: invoices.map(inv => ({
        ...inv,
        amount: Number(inv.amount) / 100, // Convert from cents
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch invoices',
    });
  }
});

/**
 * POST /api/subscriptions/apply-coupon
 * Apply a Stripe coupon/promotion code to the merchant's active subscription.
 */
router.post('/apply-coupon', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { couponCode } = z.object({ couponCode: z.string().min(1) }).parse(req.body);

    const subscription = await subscriptionService.getSubscription(merchantId);
    if (!subscription?.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_SUBSCRIPTION',
        errorMessage: 'No active subscription found',
      });
    }

    const Stripe = (await import('stripe')).default;
    const { env } = await import('../config/env');
    const stripe = new Stripe(env.stripeSecretKey, { apiVersion: '2026-01-28.clover' as any });

    // Try promotion code first, then legacy coupon
    let discount: string | undefined;
    try {
      const promo = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 });
      if (promo.data.length > 0) {
        discount = promo.data[0].id;
      }
    } catch (_) {}

    if (!discount) {
      // Fallback: try as coupon ID
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) discount = couponCode;
      } catch (_) {
        return res.status(400).json({
          success: false,
          errorCode: 'INVALID_COUPON',
          errorMessage: 'Invalid or expired coupon code',
        });
      }
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      discounts: [{ coupon: discount }],
    } as any);

    res.json({ success: true, message: 'Coupon applied successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      errorCode: 'COUPON_APPLY_FAILED',
      errorMessage: error.message || 'Failed to apply coupon',
    });
  }
});

export default router;

