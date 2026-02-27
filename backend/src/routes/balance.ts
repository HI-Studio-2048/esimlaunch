import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateSessionOrJWT);

/**
 * GET /api/balance/transactions
 * Get paginated balance transaction history for the authenticated merchant
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    });

    const { page, pageSize } = schema.parse(req.query);
    const merchantId = (req as any).merchant!.id;
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      prisma.balanceTransaction.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.balanceTransaction.count({ where: { merchantId } }),
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          amount: Number(tx.amount), // in cents
          type: tx.type,
          description: tx.description,
          createdAt: tx.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
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
        errorCode: 'FETCH_FAILED',
        errorMessage: error.message || 'Failed to fetch balance transactions',
      });
    }
  }
});

export default router;


