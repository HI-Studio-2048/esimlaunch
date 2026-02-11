import express from 'express';
import { z } from 'zod';
import { esimAccessService } from '../services/esimAccessService';
import { authenticateApiKey, logApiRequest, createRateLimiter } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { OrderStatus, BalanceTransactionType } from '@prisma/client';

const router = express.Router();

// All API routes require API key authentication, rate limiting, and logging
router.use(authenticateApiKey);
router.use(createRateLimiter());
router.use(logApiRequest);

// Validation schemas
const queryPackagesSchema = z.object({
  locationCode: z.string().optional(),
  type: z.enum(['BASE', 'TOPUP']).optional(),
  packageCode: z.string().optional(),
  slug: z.string().optional(),
  iccid: z.string().optional(),
});

const orderProfilesSchema = z.object({
  transactionId: z.string().max(50, 'Transaction ID must be 50 characters or less'),
  amount: z.number().int().optional(),
  packageInfoList: z.array(
    z.object({
      packageCode: z.string().optional(),
      slug: z.string().optional(),
      count: z.number().int().min(1),
      price: z.number().int().optional(),
      periodNum: z.number().int().min(1).max(365).optional(),
    })
  ).min(1, 'At least one package is required'),
});

const queryProfilesSchema = z.object({
  orderNo: z.string().optional(),
  iccid: z.string().optional(),
  esimTranNo: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  pager: z.object({
    pageSize: z.number().int().min(5).max(500),
    pageNum: z.number().int().min(1).max(10000),
  }).optional(),
});

const topUpSchema = z.object({
  esimTranNo: z.string().optional(),
  iccid: z.string().optional(),
  packageCode: z.string().min(1),
  transactionId: z.string().max(50),
  amount: z.number().int().optional(),
});

const sendSmsSchema = z.object({
  esimTranNo: z.string(),
  message: z.string().max(500, 'Message cannot exceed 500 characters'),
});

const usageQuerySchema = z.object({
  esimTranNoList: z.array(z.string()).min(1).max(10, 'Maximum 10 eSIMs can be queried at once'),
});

/**
 * GET /api/v1/packages
 * Get all available data packages
 */
router.get('/packages', async (req, res, next) => {
  try {
    const params = queryPackagesSchema.parse(req.query);
    const result = await esimAccessService.getPackages(params);
    res.json(result);
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
        errorCode: 'FETCH_FAILED',
        errorMessage: error.message || 'Failed to fetch packages',
      });
    }
  }
});

/**
 * POST /api/v1/orders
 * Create eSIM order
 */
router.post('/orders', async (req, res, next) => {
  try {
    const data = orderProfilesSchema.parse(req.body);
    const merchantId = req.merchant!.id;

    // Calculate order amount if not provided
    // TODO: If amount is not provided, fetch package prices from eSIM Access API
    let orderAmount = data.amount;
    if (!orderAmount) {
      // For now, require amount to be provided
      // In the future, we can fetch package prices and calculate
      return res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Order amount is required',
      });
    }

    // Check merchant balance
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { balance: true },
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        errorCode: 'MERCHANT_NOT_FOUND',
        errorMessage: 'Merchant not found',
      });
    }

    const currentBalance = Number(merchant.balance);
    if (currentBalance < orderAmount) {
      return res.status(400).json({
        success: false,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: `Insufficient balance. Current balance: ${currentBalance / 10000} USD, Required: ${orderAmount / 10000} USD`,
      });
    }

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Call eSIM Access API
      const esimResult = await esimAccessService.orderProfiles(data);

      if (esimResult.success && esimResult.obj?.orderNo) {
        // Create order in database
        const order = await tx.order.create({
          data: {
            merchantId,
            transactionId: data.transactionId,
            esimAccessOrderNo: esimResult.obj.orderNo,
            status: OrderStatus.PENDING,
            totalAmount: BigInt(orderAmount),
            packageCount: data.packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0),
          },
        });

        // Deduct balance from merchant
        const updatedMerchant = await tx.merchant.update({
          where: { id: merchantId },
          data: {
            balance: {
              decrement: BigInt(orderAmount),
            },
          },
        });

        // Verify balance didn't go negative (shouldn't happen due to check above, but safety check)
        if (Number(updatedMerchant.balance) < 0) {
          throw new Error('Balance would be negative');
        }

        // Create balance transaction record for audit
        await tx.balanceTransaction.create({
          data: {
            merchantId,
            orderId: order.id,
            amount: BigInt(-orderAmount), // Negative for deduction
            type: BalanceTransactionType.ORDER,
            description: `Order ${esimResult.obj.orderNo} - ${data.packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0)} package(s)`,
          },
        });

        return { ...esimResult, orderId: order.id };
      }

      return esimResult;
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      console.error('Order creation error:', error);
      res.status(500).json({
        success: false,
        errorCode: 'ORDER_FAILED',
        errorMessage: error.message || 'Failed to create order',
      });
    }
  }
});

/**
 * GET /api/v1/orders/:orderNo
 * Get order details by order number
 */
router.get('/orders/:orderNo', async (req, res, next) => {
  try {
    const { orderNo } = req.params;
    
    // Verify order belongs to merchant
    const order = await prisma.order.findFirst({
      where: {
        esimAccessOrderNo: orderNo,
        merchantId: req.merchant!.id,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    // Query profiles from eSIM Access
    const result = await esimAccessService.queryProfiles({ orderNo });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch order',
    });
  }
});

/**
 * GET /api/v1/profiles
 * Query eSIM profiles
 */
router.get('/profiles', async (req, res, next) => {
  try {
    const params = queryProfilesSchema.parse(req.query);
    const result = await esimAccessService.queryProfiles(params);
    res.json(result);
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
        errorCode: 'FETCH_FAILED',
        errorMessage: error.message || 'Failed to query profiles',
      });
    }
  }
});

/**
 * POST /api/v1/profiles/:esimTranNo/cancel
 * Cancel an unused eSIM profile
 */
router.post('/profiles/:esimTranNo/cancel', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const result = await esimAccessService.cancelProfile(esimTranNo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'CANCEL_FAILED',
      errorMessage: error.message || 'Failed to cancel profile',
    });
  }
});

/**
 * POST /api/v1/profiles/:esimTranNo/suspend
 * Suspend an eSIM profile
 */
router.post('/profiles/:esimTranNo/suspend', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const result = await esimAccessService.suspendProfile(esimTranNo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'SUSPEND_FAILED',
      errorMessage: error.message || 'Failed to suspend profile',
    });
  }
});

/**
 * POST /api/v1/profiles/:esimTranNo/unsuspend
 * Unsuspend an eSIM profile
 */
router.post('/profiles/:esimTranNo/unsuspend', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const result = await esimAccessService.unsuspendProfile(esimTranNo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'UNSUSPEND_FAILED',
      errorMessage: error.message || 'Failed to unsuspend profile',
    });
  }
});

/**
 * POST /api/v1/profiles/:esimTranNo/revoke
 * Revoke an eSIM profile
 */
router.post('/profiles/:esimTranNo/revoke', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const result = await esimAccessService.revokeProfile(esimTranNo);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'REVOKE_FAILED',
      errorMessage: error.message || 'Failed to revoke profile',
    });
  }
});

/**
 * POST /api/v1/profiles/:esimTranNo/topup
 * Top up an eSIM profile
 */
router.post('/profiles/:esimTranNo/topup', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const data = topUpSchema.parse({ ...req.body, esimTranNo });
    const result = await esimAccessService.topUpProfile(data);
    res.json(result);
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
        errorCode: 'TOPUP_FAILED',
        errorMessage: error.message || 'Failed to top up profile',
      });
    }
  }
});

/**
 * GET /api/v1/profiles/:esimTranNo/usage
 * Check data usage for eSIM profiles
 */
router.get('/profiles/:esimTranNo/usage', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const result = await esimAccessService.checkUsage([esimTranNo]);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'USAGE_CHECK_FAILED',
      errorMessage: error.message || 'Failed to check usage',
    });
  }
});

/**
 * POST /api/v1/profiles/usage
 * Check data usage for multiple eSIM profiles (up to 10)
 */
router.post('/profiles/usage', async (req, res, next) => {
  try {
    const data = usageQuerySchema.parse(req.body);
    const result = await esimAccessService.checkUsage(data.esimTranNoList);
    res.json(result);
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
        errorCode: 'USAGE_CHECK_FAILED',
        errorMessage: error.message || 'Failed to check usage',
      });
    }
  }
});

/**
 * GET /api/v1/balance
 * Check merchant's eSIMLaunch account balance
 */
router.get('/balance', async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchant!.id },
      select: { balance: true },
    });

    const balance = merchant?.balance ? Number(merchant.balance) : 0;

    res.json({
      success: true,
      data: {
        balance: balance, // Balance in smallest currency unit
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'BALANCE_CHECK_FAILED',
      errorMessage: error.message || 'Failed to check balance',
    });
  }
});

/**
 * GET /api/v1/regions
 * Get supported regions/countries
 */
router.get('/regions', async (req, res, next) => {
  try {
    const result = await esimAccessService.getRegions();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch regions',
    });
  }
});

/**
 * POST /api/v1/profiles/:esimTranNo/sms
 * Send SMS to an eSIM
 */
router.post('/profiles/:esimTranNo/sms', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const data = sendSmsSchema.parse({ ...req.body, esimTranNo });
    const result = await esimAccessService.sendSms(data.esimTranNo, data.message);
    res.json(result);
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
        errorCode: 'SMS_SEND_FAILED',
        errorMessage: error.message || 'Failed to send SMS',
      });
    }
  }
});

/**
 * POST /api/v1/webhooks
 * Configure webhook URL
 */
router.post('/webhooks', async (req, res, next) => {
  try {
    const { url, events, secret } = z.object({
      url: z.string().url('Invalid webhook URL'),
      events: z.array(z.enum(['ORDER_STATUS', 'ESIM_STATUS', 'DATA_USAGE', 'VALIDITY_USAGE', 'BALANCE_LOW', 'SMDP_EVENT'])).optional(),
      secret: z.string().optional(),
    }).parse(req.body);

    // Store webhook configuration
    const webhookConfig = await prisma.webhookConfig.upsert({
      where: {
        merchantId: req.merchant!.id,
      },
      update: {
        url,
        events: events || [],
        secret: secret || null,
      },
      create: {
        merchantId: req.merchant!.id,
        url,
        events: events || [],
        secret: secret || null,
      },
    });

    res.json({
      success: true,
      data: {
        id: webhookConfig.id,
        url: webhookConfig.url,
        events: webhookConfig.events,
        isActive: webhookConfig.isActive,
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
        errorCode: 'WEBHOOK_CONFIG_FAILED',
        errorMessage: error.message || 'Failed to configure webhook',
      });
    }
  }
});

/**
 * GET /api/v1/webhooks
 * Get webhook configuration
 */
router.get('/webhooks', async (req, res, next) => {
  try {
    const webhookConfig = await prisma.webhookConfig.findUnique({
      where: {
        merchantId: req.merchant!.id,
      },
    });

    if (!webhookConfig) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        id: webhookConfig.id,
        url: webhookConfig.url,
        events: webhookConfig.events,
        isActive: webhookConfig.isActive,
        createdAt: webhookConfig.createdAt,
        updatedAt: webhookConfig.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch webhook configuration',
    });
  }
});

/**
 * POST /api/v1/webhooks/test
 * Test webhook delivery
 */
router.post('/webhooks/test', async (req, res, next) => {
  try {
    const { url, secret } = z.object({
      url: z.string().url('Invalid webhook URL'),
      secret: z.string().optional(),
    }).parse(req.body);

    // Send a test webhook
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from eSIM Launch',
        test: true,
      },
    };

    try {
      const axios = require('axios');
      const response = await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          ...(secret && {
            'X-Webhook-Signature': require('crypto')
              .createHmac('sha256', secret)
              .update(JSON.stringify(testPayload))
              .digest('hex'),
          }),
        },
        timeout: 10000,
      });

      res.json({
        success: true,
        message: 'Test webhook sent successfully',
        statusCode: response.status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        errorCode: 'WEBHOOK_TEST_FAILED',
        errorMessage: error.message || 'Failed to send test webhook',
      });
    }
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
        errorCode: 'WEBHOOK_TEST_FAILED',
        errorMessage: error.message || 'Failed to test webhook',
      });
    }
  }
});

export default router;


