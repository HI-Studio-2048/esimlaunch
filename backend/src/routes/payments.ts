import express from 'express';
import { z } from 'zod';
import { paymentService } from '../services/paymentService';
import { customerOrderService } from '../services/customerOrderService';
import { authenticateJWT } from '../middleware/jwtAuth';
import { env } from '../config/env';
import Stripe from 'stripe';

const router = express.Router();

// Validation schemas
const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().default('usd'),
  metadata: z.record(z.string()).optional(),
  storeId: z.string().uuid().optional(),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  metadata: z.record(z.string()).optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  customerId: z.string().uuid().optional(), // Link to Customer account
  storeId: z.string().uuid().optional(),
  packageInfoList: z.array(z.object({
    packageCode: z.string().optional(),
    slug: z.string().optional(),
    count: z.number().int().min(1),
    price: z.number().int().optional(),
  })).optional(),
});

const refundPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().int().positive().optional(),
});

/**
 * POST /api/payments/create-intent
 * Create a payment intent
 * Can be called with JWT (merchant) or without (public store checkout)
 */
router.post('/create-intent', async (req, res, next) => {
  try {
    const data = createPaymentIntentSchema.parse(req.body);
    
    // If JWT is present, use merchant ID, otherwise allow public (store checkout)
    const merchantId = (req as any).merchant?.id;
    const storeId = data.storeId;

    const paymentIntent = await paymentService.createPaymentIntent({
      amount: data.amount,
      currency: data.currency || 'usd',
      metadata: data.metadata || {},
      merchantId,
      storeId,
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
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
      res.status(500).json({
        success: false,
        errorCode: 'PAYMENT_INTENT_CREATION_FAILED',
        errorMessage: error.message || 'Failed to create payment intent',
      });
    }
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment (called after Stripe Elements confirms payment)
 */
router.post('/confirm', async (req, res, next) => {
  try {
    const data = confirmPaymentSchema.parse(req.body);
    
    // Update payment intent metadata with customer info for webhook backup
    const updatedMetadata: Record<string, string> = {
      ...data.metadata,
    };
    
    if (data.customerEmail) {
      updatedMetadata.customerEmail = data.customerEmail;
    }
    if (data.customerName) {
      updatedMetadata.customerName = data.customerName;
    }
    if (data.storeId) {
      updatedMetadata.storeId = data.storeId;
    }
    if (data.packageInfoList) {
      updatedMetadata.packageInfoList = JSON.stringify(data.packageInfoList);
    }

    const paymentIntent = await paymentService.confirmPayment({
      paymentIntentId: data.paymentIntentId,
      metadata: updatedMetadata,
    });

    // If payment succeeded and we have order info, create customer order
    if (paymentIntent.status === 'succeeded' && data.customerEmail && data.storeId && data.packageInfoList) {
      try {
        // Get merchant ID from payment intent metadata or store
        const storeId = data.storeId;
        const store = await (await import('../lib/prisma')).prisma.store.findUnique({
          where: { id: storeId },
          select: { merchantId: true },
        });

        if (store) {
          const customerOrder = await customerOrderService.createCustomerOrder({
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            customerId: data.customerId, // Link to customer account if provided
            storeId: data.storeId,
            merchantId: store.merchantId,
            paymentIntentId: data.paymentIntentId,
            totalAmount: paymentIntent.amount,
            packageInfoList: data.packageInfoList,
            metadata: data.metadata,
          });

          return res.json({
            success: true,
            data: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              customerOrderId: customerOrder.id,
            },
          });
        }
      } catch (orderError: any) {
        console.error('Error creating customer order:', orderError);
        // Payment succeeded but order creation failed - still return success for payment
        // The order can be created manually later
      }
    }

    res.json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
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
      res.status(500).json({
        success: false,
        errorCode: 'PAYMENT_CONFIRMATION_FAILED',
        errorMessage: error.message || 'Failed to confirm payment',
      });
    }
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint (no auth, but verifies Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({
      success: false,
      errorCode: 'MISSING_SIGNATURE',
      errorMessage: 'Missing Stripe signature',
    });
  }

  if (!env.stripeWebhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping webhook verification');
    return res.status(500).json({
      success: false,
      errorCode: 'WEBHOOK_SECRET_NOT_CONFIGURED',
      errorMessage: 'Webhook secret not configured',
    });
  }

  let event: Stripe.Event;

  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_SIGNATURE',
      errorMessage: `Webhook signature verification failed: ${err.message}`,
    });
  }

  try {
    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      errorCode: 'WEBHOOK_HANDLING_FAILED',
      errorMessage: error.message || 'Failed to handle webhook',
    });
  }
});

/**
 * POST /api/payments/refund
 * Refund a payment (requires JWT authentication)
 */
router.post('/refund', authenticateJWT, async (req, res, next) => {
  try {
    const data = refundPaymentSchema.parse(req.body);
    const merchantId = (req as any).merchant!.id;

    // Verify payment intent belongs to merchant
    const paymentIntent = await paymentService.getPaymentIntent(data.paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        errorCode: 'PAYMENT_INTENT_NOT_FOUND',
        errorMessage: 'Payment intent not found',
      });
    }

    // Check if payment intent metadata has merchantId
    const intentMerchantId = paymentIntent.metadata?.merchantId;
    if (intentMerchantId && intentMerchantId !== merchantId) {
      return res.status(403).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'You do not have permission to refund this payment',
      });
    }

    const refund = await paymentService.refundPayment(
      data.paymentIntentId,
      data.amount
    );

    res.json({
      success: true,
      data: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        paymentIntentId: refund.payment_intent,
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
      res.status(500).json({
        success: false,
        errorCode: 'REFUND_FAILED',
        errorMessage: error.message || 'Failed to process refund',
      });
    }
  }
});

export default router;

