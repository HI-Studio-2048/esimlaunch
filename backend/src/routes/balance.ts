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

    const [merchant, transactions, total] = await Promise.all([
      prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { balance: true },
      }),
      prisma.balanceTransaction.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.balanceTransaction.count({ where: { merchantId } }),
    ]);

    // Compute running balance (newest first): balance after each tx = running, then go backwards
    const currentBalanceCents = merchant?.balance ? Number(merchant.balance) : 0;
    let runningCents = currentBalanceCents;
    const transactionsWithBalance = transactions.map((tx) => {
      const amount = Number(tx.amount);
      const isIncoming = tx.type === 'TOPUP' || tx.type === 'REFUND';
      const effect = isIncoming ? amount : -amount;
      const balanceAfterUsd = runningCents / 100;
      runningCents -= effect;
      return {
        id: tx.id,
        amount,
        type: tx.type,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
        balance: Math.round(balanceAfterUsd * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: {
        transactions: transactionsWithBalance,
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


