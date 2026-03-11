import express from 'express';
import { z } from 'zod';
import { ServiceType, BalanceTransactionType } from '@prisma/client';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { prisma } from '../lib/prisma';
import { webhookService } from '../services/webhookService';
import { customerOrderService } from '../services/customerOrderService';
import { paymentService } from '../services/paymentService';

const router = express.Router();

function requireEasyWay(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.merchant?.serviceType !== ServiceType.EASY) {
    return res.status(403).json({
      success: false,
      errorCode: 'EASY_WAY_ONLY',
      errorMessage: 'This feature is only available for Easy Way merchants',
    });
  }
  next();
}

// All routes require JWT authentication
router.use(authenticateSessionOrJWT);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for merchant
 */
router.get('/stats', async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    // Order statistics: include both Order (Advanced API) and CustomerOrder (Easy Way store)
    const [advOrders, advCompleted, advPending, advRevenue, easyTotal, easyCompleted, easyPending, easyRevenue] = await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.count({ where: { merchantId, status: 'COMPLETED' } }),
      prisma.order.count({ where: { merchantId, status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.order.aggregate({
        where: { merchantId, status: 'COMPLETED', totalAmount: { not: null } },
        _sum: { totalAmount: true },
      }),
      prisma.customerOrder.count({ where: { merchantId } }),
      prisma.customerOrder.count({ where: { merchantId, status: 'COMPLETED' } }),
      prisma.customerOrder.count({ where: { merchantId, status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.customerOrder.aggregate({
        where: { merchantId, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalOrders = advOrders + easyTotal;
    const completedOrders = advCompleted + easyCompleted;
    const pendingOrders = advPending + easyPending;
    // Order.totalAmount is in 1/10000 USD; CustomerOrder.totalAmount is in cents
    const advRevenueDollars = advRevenue._sum.totalAmount ? Number(advRevenue._sum.totalAmount) / 10000 : 0;
    const easyRevenueDollars = easyRevenue._sum.totalAmount ? Number(easyRevenue._sum.totalAmount) / 100 : 0;
    const totalRevenueDollars = advRevenueDollars + easyRevenueDollars;

    // Get API key count
    const apiKeyCount = await prisma.apiKey.count({
      where: {
        merchantId,
        isActive: true,
      },
    });

    // Get merchant balance from database (stored in cents; return USD)
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { balance: true },
    });
    const balance = merchant?.balance ? Number(merchant.balance) / 100 : 0;

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenueDollars,
        },
        apiKeys: {
          active: apiKeyCount,
        },
        balance: balance, // Merchant's eSIMLaunch balance in USD
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'STATS_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/dashboard/orders
 * Get order history with pagination.
 * Includes both Order (Advanced API) and CustomerOrder (Easy Way / store checkout).
 */
router.get('/orders', async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const orderWhere: any = { merchantId, customerOrderId: null };
    const customerOrderWhere: any = { merchantId };
    if (status) {
      orderWhere.status = status;
      customerOrderWhere.status = status;
    }

    const [advOrders, customerOrders, advTotal, customerTotal] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: 'desc' },
        take: page * pageSize,
        select: {
          id: true,
          transactionId: true,
          esimAccessOrderNo: true,
          status: true,
          totalAmount: true,
          packageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.customerOrder.findMany({
        where: customerOrderWhere,
        orderBy: { createdAt: 'desc' },
        take: page * pageSize,
        select: {
          id: true,
          orderId: true,
          paymentIntentId: true,
          esimAccessOrderNo: true,
          status: true,
          totalAmount: true,
          packageCount: true,
          createdAt: true,
          updatedAt: true,
          customerEmail: true,
          customerName: true,
        },
      }),
      prisma.order.count({ where: orderWhere }),
      prisma.customerOrder.count({ where: customerOrderWhere }),
    ]);

    const toAdv = (o: typeof advOrders[0]) => ({
      id: o.id,
      orderId: null,
      paymentIntentId: null,
      transactionId: o.transactionId,
      esimAccessOrderNo: o.esimAccessOrderNo,
      status: o.status,
      totalAmount: o.totalAmount ? Number(o.totalAmount) / 10000 : null,
      packageCount: o.packageCount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      customerEmail: null,
      customerName: null,
      source: 'advanced' as const,
    });
    const toCustomer = (o: typeof customerOrders[0]) => ({
      id: o.id,
      orderId: o.orderId,
      paymentIntentId: o.paymentIntentId,
      transactionId: o.paymentIntentId || o.id,
      esimAccessOrderNo: o.esimAccessOrderNo,
      status: o.status,
      totalAmount: o.totalAmount ? Number(o.totalAmount) / 100 : null,
      packageCount: o.packageCount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      customerEmail: o.customerEmail,
      customerName: o.customerName,
      source: 'store' as const,
    });

    const merged = [
      ...advOrders.map(toAdv),
      ...customerOrders.map(toCustomer),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * pageSize, page * pageSize);

    const total = advTotal + customerTotal;

    res.json({
      success: true,
      data: {
        orders: merged,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'ORDERS_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch orders',
    });
  }
});

/**
 * GET /api/dashboard/analytics
 * Get sales analytics
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders grouped by date
    const orders = await prisma.order.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        totalAmount: true,
        packageCount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyStats: Record<string, { orders: number; revenue: number; packages: number }> = {};

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: 0, revenue: 0, packages: 0 };
      }
      dailyStats[date].orders++;
      if (order.totalAmount) {
        dailyStats[date].revenue += Number(order.totalAmount) / 10000;
      }
      dailyStats[date].packages += order.packageCount;
    });

    // Convert to array format
    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    // Calculate totals
    const totals = orders.reduce(
      (acc, order) => {
        acc.orders++;
        if (order.totalAmount) {
          acc.revenue += Number(order.totalAmount) / 10000;
        }
        acc.packages += order.packageCount;
        return acc;
      },
      { orders: 0, revenue: 0, packages: 0 }
    );

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days,
        },
        totals,
        daily: chartData,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch analytics',
    });
  }
});

/* ─── Easy Way: Customers ───────────────────────────────────────────────── */

/**
 * GET /api/dashboard/customers
 * List distinct customers from CustomerOrder (Easy Way only)
 */
router.get('/customers', requireEasyWay, async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = (req.query.search as string)?.trim();
    const skip = (page - 1) * limit;

    const where: any = { merchantId };
    if (search) {
      where.OR = [
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.customerOrder.findMany({
      where,
      select: { customerEmail: true, customerName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const map = new Map<string, { name: string | null; count: number; firstAt: Date }>();
    for (const o of orders) {
      const key = o.customerEmail.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: o.customerName, count: 0, firstAt: o.createdAt });
      }
      const ent = map.get(key)!;
      ent.count++;
      if (o.createdAt < ent.firstAt) ent.firstAt = o.createdAt;
    }

    let filtered = Array.from(map.entries()).map(([email, v]) => ({
      email,
      name: v.name,
      orderCount: v.count,
      firstOrderAt: v.firstAt,
    }));

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.email.toLowerCase().includes(s) || (c.name && c.name.toLowerCase().includes(s))
      );
    }

    filtered.sort((a, b) => b.orderCount - a.orderCount);
    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        customers: paged,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'CUSTOMERS_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch customers',
    });
  }
});

/**
 * GET /api/dashboard/customers/:email
 * Customer detail with orders and profiles (Easy Way only)
 */
router.get('/customers/:email', requireEasyWay, async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const email = decodeURIComponent(req.params.email);

    const orders = await prisma.customerOrder.findMany({
      where: {
        merchantId,
        customerEmail: { equals: email, mode: 'insensitive' },
      },
      include: {
        order: {
          select: {
            id: true,
            esimAccessOrderNo: true,
            status: true,
            createdAt: true,
          },
        },
        store: { select: { businessName: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'CUSTOMER_NOT_FOUND',
        errorMessage: 'Customer not found',
      });
    }

    const orderIds = orders.map((o) => o.orderId).filter(Boolean) as string[];
    const profiles = orderIds.length > 0
      ? await prisma.esimProfile.findMany({
          where: { orderId: { in: orderIds } },
          select: {
            id: true,
            iccid: true,
            esimTranNo: true,
            packageName: true,
            esimStatus: true,
            orderedAt: true,
          },
        })
      : [];

    res.json({
      success: true,
      data: {
        email,
        name: orders[0].customerName,
        orders: orders.map((o) => ({
          id: o.id,
          orderId: o.orderId,
          status: o.status,
          totalAmount: Number(o.totalAmount) / 100,
          packageCount: o.packageCount,
          createdAt: o.createdAt,
          storeName: o.store.businessName || o.store.name,
          esimAccessOrderNo: o.esimAccessOrderNo,
        })),
        profiles,
        totalOrders: orders.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'CUSTOMER_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch customer',
    });
  }
});

/* ─── Easy Way: Order operations ─────────────────────────────────────────── */

/**
 * POST /api/dashboard/orders/:orderId/retry
 * Retry provisioning for a merchant Order (triggers deliverESIMs)
 */
router.post('/orders/:orderId/retry', async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, merchantId },
      include: { customerOrder: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        errorCode: 'ALREADY_COMPLETED',
        errorMessage: 'Order is already completed. Use sync to refresh status.',
      });
    }

    await webhookService.deliverESIMs(order.id);

    res.json({
      success: true,
      message: 'Retry initiated. eSIMs will be delivered when ready.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message || 'Failed to retry order',
    });
  }
});

/**
 * POST /api/dashboard/orders/:orderId/sync
 * Sync eSIM profiles from provider for this order
 */
router.post('/orders/:orderId/sync', async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, merchantId },
    });

    if (!order?.esimAccessOrderNo) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found or missing esimAccessOrderNo',
      });
    }

    await webhookService.deliverESIMs(order.id);

    res.json({
      success: true,
      message: 'Sync completed. Profiles updated and email sent if newly ready.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'SYNC_FAILED',
      errorMessage: error.message || 'Failed to sync order',
    });
  }
});

/**
 * POST /api/dashboard/customer-orders/:id/refund
 * Refund a store order via Stripe (Easy Way store orders only)
 */
router.post('/customer-orders/:id/refund', async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const customerOrderId = req.params.id;
    const { amountCents } = req.body || {};

    const customerOrder = await prisma.customerOrder.findFirst({
      where: { id: customerOrderId, merchantId },
      include: { order: true },
    });

    if (!customerOrder) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    if (!customerOrder.paymentIntentId || customerOrder.paymentIntentId.startsWith('template_')) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_STRIPE_REFUND',
        errorMessage: 'This order was not paid via Stripe. Refund via balance credit if applicable.',
      });
    }

    const refundAmount = amountCents
      ? Math.min(Number(amountCents), Number(customerOrder.totalAmount))
      : Number(customerOrder.totalAmount);

    await paymentService.refundPayment(customerOrder.paymentIntentId, refundAmount);

    await prisma.$transaction(async (tx) => {
      await tx.customerOrder.update({
        where: { id: customerOrderId },
        data: { status: 'CANCELLED' },
      });
      if (customerOrder.orderId) {
        await tx.order.update({
          where: { id: customerOrder.orderId },
          data: { status: 'CANCELLED' },
        });
      }
      await tx.merchant.update({
        where: { id: merchantId },
        data: { balance: { increment: BigInt(refundAmount) } },
      });
      await tx.balanceTransaction.create({
        data: {
          merchantId,
          orderId: customerOrder.orderId,
          amount: BigInt(refundAmount),
          type: BalanceTransactionType.REFUND,
          description: `Refund for customer order ${customerOrderId}`,
        },
      });
    });

    res.json({
      success: true,
      message: `Refunded $${(refundAmount / 100).toFixed(2)}`,
      refundAmountCents: refundAmount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'REFUND_FAILED',
      errorMessage: error.message || 'Failed to process refund',
    });
  }
});

/**
 * POST /api/dashboard/customer-orders/:id/resend-receipt
 * Resend eSIM delivery email (delegates to customerOrderService flow)
 */
router.post('/customer-orders/:id/resend-receipt', async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const customerOrderId = req.params.id;

    const customerOrder = await prisma.customerOrder.findFirst({
      where: { id: customerOrderId, merchantId },
    });

    if (!customerOrder?.orderId) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found or not yet linked',
      });
    }

    await webhookService.deliverESIMs(customerOrder.orderId);

    res.json({
      success: true,
      message: 'eSIM delivery email has been resent',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'RESEND_FAILED',
      errorMessage: error.message || 'Failed to resend email',
    });
  }
});

/**
 * DELETE /api/dashboard/orders/:orderId
 * Delete a pending order (no eSIMs created yet)
 */
router.delete('/orders/:orderId', async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const orderId = req.params.orderId;

    const order = await prisma.order.findFirst({
      where: { id: orderId, merchantId },
      include: {
        customerOrder: true,
        balanceTransactions: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    if (!['PENDING', 'FAILED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        errorCode: 'CANNOT_DELETE',
        errorMessage: 'Only pending or failed orders can be deleted',
      });
    }

    const refundCents = order.totalAmount
      ? order.customerOrderId
        ? Number(order.totalAmount)
        : Math.round(Number(order.totalAmount) / 100)
      : 0;

    await prisma.$transaction(async (tx) => {
      if (order.customerOrder) {
        await tx.customerOrder.delete({ where: { id: order.customerOrder.id } });
      }
      await tx.balanceTransaction.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });
      if (refundCents > 0) {
        await tx.merchant.update({
          where: { id: merchantId },
          data: { balance: { increment: BigInt(refundCents) } },
        });
        await tx.balanceTransaction.create({
          data: {
            merchantId,
            amount: BigInt(refundCents),
            type: BalanceTransactionType.REFUND,
            description: `Refund for deleted order ${orderId}`,
          },
        });
      }
    });

    res.json({
      success: true,
      message: 'Order deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'DELETE_FAILED',
      errorMessage: error.message || 'Failed to delete order',
    });
  }
});

/* ─── Easy Way: Top-ups ──────────────────────────────────────────────────── */

/**
 * GET /api/dashboard/topups
 * List customer eSIM top-ups (Easy Way only)
 */
router.get('/topups', requireEasyWay, async (req, res) => {
  try {
    const merchantId = req.merchant!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [topups, total] = await Promise.all([
      prisma.customerTopUp.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customerTopUp.count({ where: { merchantId } }),
    ]);

    res.json({
      success: true,
      data: {
        topups: topups.map((t) => ({
          id: t.id,
          customerEmail: t.customerEmail,
          customerName: t.customerName,
          iccid: t.iccid,
          esimTranNo: t.esimTranNo,
          packageCode: t.packageCode,
          amountCents: t.amountCents,
          status: t.status,
          paymentRef: t.paymentRef,
          createdAt: t.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'TOPUPS_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch top-ups',
    });
  }
});

export default router;


