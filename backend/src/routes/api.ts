import express from 'express';
import { z } from 'zod';
import { esimAccessService } from '../services/esimAccessService';
import { authenticateSessionOrApiKey, logApiRequest, createRateLimiter } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { OrderStatus, BalanceTransactionType } from '@prisma/client';

const router = express.Router();

// Auth: session cookie (Prisma DB) or Bearer (JWT/API key). Rate limiting and logging.
router.use(authenticateSessionOrApiKey);
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
    pageSize: z.coerce.number().int().min(5).max(500),
    pageNum: z.coerce.number().int().min(1).max(10000),
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

    // Resolve order amount: use provided amount or compute from package list (eSIM Access price in 1/10000 USD)
    let orderAmountApi = data.amount;
    if (orderAmountApi == null) {
      try {
        orderAmountApi = await esimAccessService.getOrderAmountFromPackages(data.packageInfoList);
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          errorCode: 'VALIDATION_ERROR',
          errorMessage: err?.message || 'Could not resolve order amount from packages',
        });
      }
    }

    // Merchant balance is stored in cents (USD). Convert API amount (1/10000 USD) to cents for comparison.
    const orderAmountCents = Math.round(Number(orderAmountApi) / 100);
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
    if (currentBalance < orderAmountCents) {
      return res.status(400).json({
        success: false,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: `Insufficient balance. Current balance: $${(currentBalance / 100).toFixed(2)} USD, Required: $${(orderAmountCents / 100).toFixed(2)} USD`,
      });
    }

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Call eSIM Access API with amount in API units (1/10000 USD)
      const payload = { ...data, amount: orderAmountApi };
      const esimResult = await esimAccessService.orderProfiles(payload);

      if (esimResult.success && esimResult.obj?.orderNo) {
        // Create order in database (store amount in 1/10000 USD for Advanced orders)
        const order = await tx.order.create({
          data: {
            merchantId,
            transactionId: data.transactionId,
            esimAccessOrderNo: esimResult.obj.orderNo,
            status: OrderStatus.PENDING,
            totalAmount: BigInt(orderAmountApi),
            packageCount: data.packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0),
          },
        });

        // Deduct balance from merchant (balance is in cents)
        const updatedMerchant = await tx.merchant.update({
          where: { id: merchantId },
          data: {
            balance: {
              decrement: BigInt(orderAmountCents),
            },
          },
        });

        // Verify balance didn't go negative (shouldn't happen due to check above, but safety check)
        if (Number(updatedMerchant.balance) < 0) {
          throw new Error('Balance would be negative');
        }

        // Create balance transaction record for audit (amount in cents)
        await tx.balanceTransaction.create({
          data: {
            merchantId,
            orderId: order.id,
            amount: BigInt(-orderAmountCents), // Negative for deduction
            type: BalanceTransactionType.ORDER,
            description: `Order ${esimResult.obj.orderNo} - ${data.packageInfoList.reduce((sum, pkg) => sum + pkg.count, 0)} package(s)`,
          },
        });

        // Best-effort: look up package names and pre-populate EsimProfile rows via ORDER_STATUS webhook.
        // packageName + coverage are stored when profiles arrive via webhook or first profile query.
        console.log(`[Order] Created order ${esimResult.obj?.orderNo} for merchant ${merchantId}`);

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
 * Query eSIM profiles - returns live eSIM Access data enriched with DB metadata
 * (packageName, coverage, nickname, orderedAt, etc.)
 */
router.get('/profiles', async (req, res, next) => {
  try {
    const params = queryProfilesSchema.parse(req.query);
    const merchantId = req.merchant!.id;
    const result = await esimAccessService.queryProfiles(params);

    if (result.success && result.obj?.esimList?.length) {
      const apiProfiles = result.obj.esimList;

      // Look up our DB records for these profiles
      const esimTranNos = apiProfiles.map(p => p.esimTranNo).filter(Boolean);
      const dbRecords = await prisma.esimProfile.findMany({
        where: { merchantId, esimTranNo: { in: esimTranNos } },
      });
      const dbMap = new Map(dbRecords.map(r => [r.esimTranNo, r]));

      // Upsert profiles in DB and enrich with package name (async, don't block response)
      setImmediate(async () => {
        try {
          for (const p of apiProfiles) {
            const existingDb = dbMap.get(p.esimTranNo);
            const pkgCode = p.packageList?.[0]?.packageCode ?? null;
            const locCode = p.packageList?.[0]?.locationCode ?? null;

            // Enrich from package catalog when we have a package code
            let packageName = existingDb?.packageName ?? null;
            let planPrice: number | null = existingDb?.planPrice ?? null;
            let supportTopUpType: string | null = existingDb?.supportTopUpType ?? null;
            if (pkgCode) {
              try {
                const pkgList = await esimAccessService.getPackages({ packageCode: pkgCode });
                const pkg = pkgList.obj?.packageList?.[0];
                if (pkg) {
                  if (!packageName) packageName = pkg.name ?? null;
                  if (planPrice == null && pkg.price != null) planPrice = pkg.price;
                  const raw = (pkg as any).supportTopUpType;
                  if (!supportTopUpType && raw != null) supportTopUpType = typeof raw === 'string' ? raw : String(raw);
                }
              } catch (_) { /* non-fatal */ }
            }

            // Build coverage from packageList locationCodes
            let coverage: Array<{ country: string; locationCode: string }> | null = null;
            if (p.packageList?.length) {
              coverage = p.packageList.map(pkg => ({
                locationCode: pkg.locationCode,
                country: pkg.locationCode, // frontend will decode with getCountryName
              }));
            }

            await prisma.esimProfile.upsert({
              where: { esimTranNo: p.esimTranNo },
              create: {
                merchantId,
                esimTranNo: p.esimTranNo,
                iccid: p.iccid ?? null,
                orderNo: p.orderNo ?? null,
                ac: (p as any).ac ?? null,
                qrCodeUrl: p.qrCodeUrl ?? null,
                shortUrl: (p as any).shortUrl ?? null,
                smsStatus: p.smsStatus ?? null,
                dataType: p.dataType ?? null,
                activeType: (p.activeType ? parseInt(String(p.activeType)) : null),
                packageCode: pkgCode,
                packageName,
                planPrice,
                supportTopUpType: supportTopUpType != null ? supportTopUpType : null,
                locationCode: locCode,
                coverage: coverage as any,
                orderedAt: new Date(),
              },
              update: {
                iccid: p.iccid ?? undefined,
                ac: (p as any).ac ?? undefined,
                qrCodeUrl: p.qrCodeUrl ?? undefined,
                shortUrl: (p as any).shortUrl ?? undefined,
                activeType: (p.activeType ? parseInt(String(p.activeType)) : undefined),
                packageCode: pkgCode ?? undefined,
                packageName: packageName ?? undefined,
                planPrice: planPrice ?? undefined,
                supportTopUpType: (supportTopUpType != null ? String(supportTopUpType) : undefined),
                locationCode: locCode ?? undefined,
                coverage: coverage ? coverage as any : undefined,
              },
            });
          }
        } catch (e) {
          console.error('Failed to upsert eSIM profiles in DB:', e);
        }
      });

      // Order totals (our DB): eSIM Access does not return "total amount paid" per profile
      const orderNos = [...new Set(apiProfiles.map(p => p.orderNo).filter(Boolean))] as string[];
      const orders = orderNos.length
        ? await prisma.order.findMany({
            where: { merchantId, esimAccessOrderNo: { in: orderNos } },
            select: { esimAccessOrderNo: true, totalAmount: true },
          })
        : [];
      const orderTotalMap = new Map(orders.map(o => [o.esimAccessOrderNo, o.totalAmount]));

      // Merge DB metadata into API response; normalize device fields (API may use snake_case)
      result.obj.esimList = apiProfiles.map(p => {
        const raw = p as any;
        const db = dbMap.get(p.esimTranNo);
        const orderTotal = p.orderNo ? orderTotalMap.get(p.orderNo) : null;
        const merged = {
          ...p,
          // eSIM Access may return device_brand, device_type, device_model
          deviceBrand: raw.deviceBrand ?? raw.device_brand ?? undefined,
          deviceType: raw.deviceType ?? raw.device_type ?? undefined,
          deviceModel: raw.deviceModel ?? raw.device_model ?? undefined,
          nickname: db?.nickname ?? undefined,
          packageName: db?.packageName ?? undefined,
          coverage: db?.coverage ? (db.coverage as any) : undefined,
          orderedAt: db?.orderedAt?.toISOString() ?? undefined,
          dbCreatedAt: db?.createdAt.toISOString() ?? undefined,
          ac: raw.ac ?? db?.ac ?? undefined,
          shortUrl: raw.shortUrl ?? db?.shortUrl ?? undefined,
          planPrice: db?.planPrice ?? undefined,
          supportTopUpType: db?.supportTopUpType ?? undefined,
          totalAmount: orderTotal != null ? Number(orderTotal) : undefined,
        };
        return merged;
      });
    }

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
 * PUT /api/v1/profiles/:esimTranNo/nickname
 * Save a nickname for an eSIM profile (stored in our DB, not eSIM Access)
 */
router.put('/profiles/:esimTranNo/nickname', async (req, res, next) => {
  try {
    const { esimTranNo } = req.params;
    const { nickname } = req.body;
    const merchantId = req.merchant!.id;

    const profile = await prisma.esimProfile.upsert({
      where: { esimTranNo },
      create: { merchantId, esimTranNo, nickname: nickname ?? null },
      update: { nickname: nickname ?? null },
    });

    res.json({ success: true, data: { nickname: profile.nickname } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'UPDATE_FAILED',
      errorMessage: error.message || 'Failed to save nickname',
    });
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

    // Balance is stored in cents (USD); return in USD for display
    const balanceCents = merchant?.balance ? Number(merchant.balance) : 0;
    const balance = balanceCents / 100;

    res.json({
      success: true,
      data: {
        balance, // Balance in USD
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
    // Find existing config for this merchant
    const existingConfig = await prisma.webhookConfig.findFirst({
      where: {
        merchantId: req.merchant!.id,
      },
    });

    const webhookConfig = existingConfig
      ? await prisma.webhookConfig.update({
          where: {
            id: existingConfig.id,
          },
          data: {
            url,
            events: events || [],
            secret: secret || null,
          },
        })
      : await prisma.webhookConfig.create({
          data: {
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
    const webhookConfig = await prisma.webhookConfig.findFirst({
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


