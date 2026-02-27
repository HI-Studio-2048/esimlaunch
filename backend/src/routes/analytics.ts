import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { analyticsService } from '../services/analyticsService';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateSessionOrJWT);

// Validation schemas
const analyticsFiltersSchema = z.object({
  storeId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics
 */
router.get('/revenue', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const filters = analyticsFiltersSchema.parse(req.query);

    const analytics = await analyticsService.getRevenueAnalytics({
      merchantId,
      ...filters,
    });

    res.json({
      success: true,
      data: analytics,
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
        errorCode: 'ANALYTICS_FAILED',
        errorMessage: error.message || 'Failed to fetch revenue analytics',
      });
    }
  }
});

/**
 * GET /api/analytics/orders
 * Get order analytics
 */
router.get('/orders', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const filters = analyticsFiltersSchema.parse(req.query);

    const analytics = await analyticsService.getOrderAnalytics({
      merchantId,
      ...filters,
    });

    res.json({
      success: true,
      data: analytics,
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
        errorCode: 'ANALYTICS_FAILED',
        errorMessage: error.message || 'Failed to fetch order analytics',
      });
    }
  }
});

/**
 * GET /api/analytics/packages
 * Get package analytics
 */
router.get('/packages', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const filters = analyticsFiltersSchema.parse(req.query);

    const analytics = await analyticsService.getPackageAnalytics({
      merchantId,
      ...filters,
    });

    res.json({
      success: true,
      data: analytics,
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
        errorCode: 'ANALYTICS_FAILED',
        errorMessage: error.message || 'Failed to fetch package analytics',
      });
    }
  }
});

/**
 * GET /api/analytics/customers
 * Get customer analytics
 */
router.get('/customers', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const filters = analyticsFiltersSchema.parse(req.query);

    const analytics = await analyticsService.getCustomerAnalytics({
      merchantId,
      ...filters,
    });

    res.json({
      success: true,
      data: analytics,
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
        errorCode: 'ANALYTICS_FAILED',
        errorMessage: error.message || 'Failed to fetch customer analytics',
      });
    }
  }
});

/**
 * GET /api/analytics/summary
 * Get dashboard summary
 */
router.get('/summary', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const storeId = req.query.storeId as string | undefined;

    const summary = await analyticsService.getDashboardSummary(merchantId, storeId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'ANALYTICS_FAILED',
      errorMessage: error.message || 'Failed to fetch dashboard summary',
    });
  }
});

export default router;










