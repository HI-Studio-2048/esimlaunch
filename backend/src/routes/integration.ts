import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * POST /api/integration/template-order
 * Register an order from a linked template site so it appears in the dashboard.
 * Auth: x-template-sync-secret header must match TEMPLATE_ORDER_SYNC_SECRET.
 */
router.post('/template-order', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret) {
    return res.status(501).json({
      success: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Template order sync is not configured',
    });
  }

  const provided = req.headers['x-template-sync-secret'];
  if (provided !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }

  const { storeId, templateOrderId, customerEmail, customerName, totalAmountCents, packageCount, status, paymentRef } = req.body || {};

  if (!storeId || !templateOrderId || !customerEmail || totalAmountCents == null) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'storeId, templateOrderId, customerEmail, totalAmountCents required',
    });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { merchantId: true },
    });
    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    const dedupeId = `template_${storeId}_${templateOrderId}`;
    const existing = await prisma.customerOrder.findFirst({
      where: { paymentIntentId: dedupeId },
    });
    if (existing) {
      return res.json({ success: true, orderId: existing.id, duplicate: true });
    }

    const customerOrder = await prisma.customerOrder.create({
      data: {
        customerEmail,
        customerName: customerName || null,
        storeId,
        merchantId: store.merchantId,
        paymentIntentId: dedupeId,
        totalAmount: BigInt(Math.round(Number(totalAmountCents))),
        packageCount: packageCount ?? 1,
        status: status === 'COMPLETED' ? 'COMPLETED' : status === 'PROCESSING' ? 'PROCESSING' : 'PENDING',
      },
    });

    return res.json({ success: true, orderId: customerOrder.id });
  } catch (err: any) {
    console.error('Template order sync failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'SYNC_FAILED',
      errorMessage: err?.message || 'Failed to register order',
    });
  }
});

/**
 * POST /api/integration/topup
 * Register a customer eSIM top-up from a linked template site.
 * Auth: x-template-sync-secret header must match TEMPLATE_ORDER_SYNC_SECRET.
 */
router.post('/topup', async (req, res) => {
  const secret = process.env.TEMPLATE_ORDER_SYNC_SECRET;
  if (!secret) {
    return res.status(501).json({
      success: false,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Template sync is not configured',
    });
  }

  const provided = req.headers['x-template-sync-secret'];
  if (provided !== secret) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Invalid sync secret',
    });
  }

  const { storeId, merchantId, customerEmail, customerName, iccid, esimTranNo, packageCode, amountCents, status, paymentRef } = req.body || {};

  if ((!merchantId && !storeId) || !customerEmail || amountCents == null) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PAYLOAD',
      errorMessage: 'merchantId or storeId, customerEmail, amountCents required',
    });
  }

  try {
    let resolvedMerchantId = merchantId;
    if (!resolvedMerchantId && storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { merchantId: true },
      });
      if (!store) {
        return res.status(404).json({
          success: false,
          errorCode: 'STORE_NOT_FOUND',
          errorMessage: 'Store not found',
        });
      }
      resolvedMerchantId = store.merchantId;
    }

    const topup = await prisma.customerTopUp.create({
      data: {
        merchantId: resolvedMerchantId,
        storeId: storeId || null,
        customerEmail,
        customerName: customerName || null,
        iccid: iccid || null,
        esimTranNo: esimTranNo || null,
        packageCode: packageCode || null,
        amountCents: Math.round(Number(amountCents)),
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
        paymentRef: paymentRef || null,
      },
    });

    return res.json({ success: true, topupId: topup.id });
  } catch (err: any) {
    console.error('Top-up sync failed:', err);
    return res.status(500).json({
      success: false,
      errorCode: 'SYNC_FAILED',
      errorMessage: err?.message || 'Failed to register top-up',
    });
  }
});

export default router;
