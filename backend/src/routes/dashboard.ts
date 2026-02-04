import express from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { prisma } from '../lib/prisma';
import { esimAccessService } from '../services/esimAccessService';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateJWT);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for merchant
 */
router.get('/stats', async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    // Get order statistics
    const [totalOrders, completedOrders, pendingOrders, totalRevenue] = await Promise.all([
      prisma.order.count({
        where: { merchantId },
      }),
      prisma.order.count({
        where: {
          merchantId,
          status: 'COMPLETED',
        },
      }),
      prisma.order.count({
        where: {
          merchantId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      prisma.order.aggregate({
        where: {
          merchantId,
          status: 'COMPLETED',
          totalAmount: { not: null },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // Get API key count
    const apiKeyCount = await prisma.apiKey.count({
      where: {
        merchantId,
        isActive: true,
      },
    });

    // Get account balance from eSIM Access
    let balance = 0;
    try {
      const balanceResult = await esimAccessService.checkBalance();
      if (balanceResult.success && balanceResult.obj?.balance) {
        balance = balanceResult.obj.balance;
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenue._sum.totalAmount
            ? Number(totalRevenue._sum.totalAmount) / 10000
            : 0, // Convert from smallest unit to USD
        },
        apiKeys: {
          active: apiKeyCount,
        },
        balance: balance / 10000, // Convert from smallest unit to USD
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
 * Get order history with pagination
 */
router.get('/orders', async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const where: any = { merchantId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          ...order,
          totalAmount: order.totalAmount ? Number(order.totalAmount) / 10000 : null,
        })),
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

export default router;

