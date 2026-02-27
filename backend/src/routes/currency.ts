import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { currencyService } from '../services/currencyService';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Validation schemas
const convertSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  from: z.string().min(3).max(3),
  to: z.string().min(3).max(3),
  storeId: z.string().uuid().optional(),
});

const updateStoreCurrencySchema = z.object({
  defaultCurrency: z.string().min(3).max(3),
  supportedCurrencies: z.array(z.string().min(3).max(3)).min(1),
});

/**
 * GET /api/currency/list
 * Get all available currencies
 */
router.get('/list', async (req, res, next) => {
  try {
    const currencies = currencyService.getAvailableCurrencies();
    res.json({
      success: true,
      data: currencies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch currencies',
    });
  }
});

/**
 * POST /api/currency/convert
 * Convert amount between currencies
 */
router.post('/convert', async (req, res, next) => {
  try {
    const data = convertSchema.parse(req.body);
    const convertedAmount = await currencyService.getPriceInCurrency(
      data.amount,
      data.from,
      data.to,
      data.storeId
    );

    res.json({
      success: true,
      data: {
        originalAmount: data.amount,
        originalCurrency: data.from,
        convertedAmount,
        targetCurrency: data.to,
        exchangeRate: convertedAmount / data.amount,
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
        errorCode: 'CONVERSION_FAILED',
        errorMessage: error.message || 'Failed to convert currency',
      });
    }
  }
});

/**
 * GET /api/currency/store/:storeId
 * Get store currency settings
 */
router.get('/store/:storeId', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const settings = await currencyService.getStoreCurrency(storeId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch store currency settings',
    });
  }
});

/**
 * PUT /api/currency/store/:storeId
 * Update store currency settings (requires authentication)
 */
router.put('/store/:storeId', authenticateSessionOrJWT, async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const merchantId = (req as any).merchant!.id;
    const data = updateStoreCurrencySchema.parse(req.body);

    // Verify store belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    await currencyService.updateStoreCurrency(
      storeId,
      data.defaultCurrency,
      data.supportedCurrencies
    );

    res.json({
      success: true,
      message: 'Currency settings updated successfully',
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
        errorCode: 'UPDATE_FAILED',
        errorMessage: error.message || 'Failed to update currency settings',
      });
    }
  }
});

export default router;

