import express from 'express';
import { z } from 'zod';
import { BalanceTransactionType } from '@prisma/client';
import { paymentService } from '../services/paymentService';
import { customerOrderService } from '../services/customerOrderService';
import { prisma } from '../lib/prisma';
import { preferencesService } from '../services/preferencesService';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
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
 * GET /api/payments/methods
 * List saved Stripe payment methods for the authenticated merchant.
 */
router.get('/methods', authenticateSessionOrJWT, async (req, res) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const stripe = new Stripe(env.stripeSecretKey || '', { apiVersion: '2024-11-20.acacia' as any });
    const { prisma } = await import('../lib/prisma');
    const sub = await prisma.subscription.findUnique({
      where: { merchantId },
      select: { stripeCustomerId: true },
    });
    if (!sub?.stripeCustomerId) {
      return res.json({ success: true, paymentMethods: [] });
    }
    const methods = await stripe.paymentMethods.list({
      customer: sub.stripeCustomerId,
      type: 'card',
    });
    const formatted = methods.data.map(m => ({
      id: m.id,
      card: {
        brand: m.card?.brand,
        last4: m.card?.last4,
        exp_month: m.card?.exp_month,
        exp_year: m.card?.exp_year,
      },
      isDefault: false,
    }));
    res.json({ success: true, paymentMethods: formatted });
  } catch (e: any) {
    res.status(500).json({ success: false, errorCode: 'FAILED', errorMessage: e.message || 'Failed to load payment methods' });
  }
});

/**
 * DELETE /api/payments/methods/:methodId
 * Detach a payment method from the merchant's Stripe customer.
 */
router.delete('/methods/:methodId', authenticateSessionOrJWT, async (req, res) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const methodId = req.params.methodId;
    if (!methodId) {
      return res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Payment method ID is required',
      });
    }

    const stripe = new Stripe(env.stripeSecretKey || '', { apiVersion: '2024-11-20.acacia' as any });
    const { prisma } = await import('../lib/prisma');
    const sub = await prisma.subscription.findUnique({
      where: { merchantId },
      select: { stripeCustomerId: true },
    });
    if (!sub?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_CUSTOMER',
        errorMessage: 'No payment methods to remove',
      });
    }

    const pm = await stripe.paymentMethods.retrieve(methodId);
    if (pm.customer !== sub.stripeCustomerId) {
      return res.status(403).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'This payment method does not belong to your account',
      });
    }

    await stripe.paymentMethods.detach(methodId);
    res.json({ success: true, message: 'Payment method removed' });
  } catch (e: any) {
    if (e?.code === 'resource_missing') {
      return res.status(404).json({
        success: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Payment method not found',
      });
    }
    res.status(500).json({
      success: false,
      errorCode: 'DELETE_FAILED',
      errorMessage: e?.message || 'Failed to remove payment method',
    });
  }
});

/**
 * POST /api/payments/setup-intent
 * Create a Stripe SetupIntent so the merchant can save a payment method.
 */
router.post('/setup-intent', authenticateSessionOrJWT, async (req, res) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const stripe = new Stripe(env.stripeSecretKey || '', { apiVersion: '2024-11-20.acacia' as any });
    const { prisma } = await import('../lib/prisma');

    // Get or create Stripe customer
    let sub = await prisma.subscription.findUnique({
      where: { merchantId },
      select: { stripeCustomerId: true },
    });

    let customerId = sub?.stripeCustomerId;
    if (!customerId) {
      // Check if we created a customer earlier (e.g. during a previous setup-intent before subscription existed)
      const stored = await preferencesService.get<string>(merchantId, 'stripe_customer_id');
      if (stored) {
        customerId = stored;
      }
    }
    if (!customerId) {
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { email: true, name: true } });
      if (!merchant) {
        return res.status(404).json({
          success: false,
          errorCode: 'MERCHANT_NOT_FOUND',
          errorMessage: 'Merchant not found',
        });
      }
      const customer = await stripe.customers.create({
        email: merchant.email,
        name: merchant.name || undefined,
        metadata: { merchantId },
      });
      customerId = customer.id;
      await preferencesService.set(merchantId, 'stripe_customer_id', customerId);
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'SETUP_INTENT_FAILED',
      errorMessage: error.message || 'Failed to create setup intent',
    });
  }
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
        // Surface insufficient balance errors to the frontend
        if (orderError?.code === 'INSUFFICIENT_BALANCE') {
          return res.status(400).json({
            success: false,
            errorCode: 'INSUFFICIENT_BALANCE',
            errorMessage: 'Store balance is too low to fulfill this order. Please try again later.',
          });
        }

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
 * POST /api/payments/topup-balance
 * Create a Stripe payment intent for topping up a merchant's balance (requires JWT auth)
 */
router.post('/topup-balance', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const schema = z.object({
      amount: z.number().int().positive('Amount must be a positive integer (cents)'),
      currency: z.string().default('usd'),
    });
    const data = schema.parse(req.body);
    const merchantId = (req as any).merchant!.id;

    const paymentIntent = await paymentService.createPaymentIntent({
      amount: data.amount,
      currency: data.currency || 'usd',
      metadata: { type: 'TOPUP', merchantId },
      merchantId,
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
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
        errorCode: 'TOPUP_INTENT_FAILED',
        errorMessage: error.message || 'Failed to create top-up payment intent',
      });
    }
  }
});

/**
 * POST /api/payments/confirm-topup
 * Confirm a topup payment intent and credit the merchant's balance
 */
router.post('/confirm-topup', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const schema = z.object({
      paymentIntentId: z.string().min(1),
    });
    const { paymentIntentId } = schema.parse(req.body);
    const merchantId = (req as any).merchant!.id;

    const paymentIntent = await paymentService.confirmPayment({ paymentIntentId });

    // Verify this payment intent belongs to the authenticated merchant
    const intentMerchantId = paymentIntent.metadata?.merchantId;
    if (intentMerchantId && intentMerchantId !== merchantId) {
      return res.status(403).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'This payment does not belong to your account.',
      });
    }

    if (paymentIntent.status === 'succeeded') {
      const { prisma } = await import('../lib/prisma');
      const amountCents = paymentIntent.amount; // already in cents from Stripe

      // Idempotency: skip if we already credited this payment intent (prevent double-credit on retry)
      const existingTx = await prisma.balanceTransaction.findFirst({
        where: {
          merchantId,
          type: 'TOPUP',
          description: { contains: paymentIntent.id },
        },
      });
      if (existingTx) {
        return res.json({
          success: true,
          data: { id: paymentIntent.id, status: paymentIntent.status, amount: amountCents },
        });
      }

      // Credit merchant balance and record transaction
      await prisma.$transaction([
        prisma.merchant.update({
          where: { id: merchantId },
          data: { balance: { increment: BigInt(amountCents) } },
        }),
        prisma.balanceTransaction.create({
          data: {
            merchantId,
            amount: BigInt(amountCents),
            type: 'TOPUP',
            description: `Balance top-up via Stripe (${paymentIntent.id})`,
          },
        }),
      ]);

      return res.json({
        success: true,
        data: { id: paymentIntent.id, status: paymentIntent.status, amount: amountCents },
      });
    }

    return res.status(400).json({
      success: false,
      errorCode: 'PAYMENT_NOT_COMPLETED',
      errorMessage: 'Payment has not been completed. Please complete the payment before confirming.',
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
        errorCode: 'TOPUP_CONFIRM_FAILED',
        errorMessage: error.message || 'Failed to confirm top-up',
      });
    }
  }
});

/**
 * POST /api/payments/refund
 * Refund a payment (requires JWT authentication)
 */
router.post('/refund', authenticateSessionOrJWT, async (req, res, next) => {
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

    // If this was a store (Easy) order, credit merchant balance and record refund
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { paymentIntentId: data.paymentIntentId },
      select: { id: true, merchantId: true, totalAmount: true },
    });
    if (customerOrder && customerOrder.merchantId === merchantId) {
      const refundCents = Number(customerOrder.totalAmount);
      await prisma.$transaction([
        prisma.customerOrder.update({
          where: { id: customerOrder.id },
          data: { status: 'CANCELLED', updatedAt: new Date() },
        }),
        prisma.merchant.update({
          where: { id: merchantId },
          data: { balance: { increment: BigInt(refundCents) } },
        }),
        prisma.balanceTransaction.create({
          data: {
            merchantId,
            amount: BigInt(refundCents),
            type: BalanceTransactionType.REFUND,
            description: `Refund for customer order (payment ${data.paymentIntentId})`,
          },
        }),
      ]);
    }

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

