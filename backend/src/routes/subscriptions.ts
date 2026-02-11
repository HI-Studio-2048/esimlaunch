import express from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { subscriptionService } from '../services/subscriptionService';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateJWT);

// Validation schemas
const createSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale']),
  billingPeriod: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale']),
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

export default router;

