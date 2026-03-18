import express from 'express';
import { customerOrderService } from '../services/customerOrderService';
import { generateOrderToken, verifyOrderToken } from '../services/customerOrderService';
import { webhookService } from '../services/webhookService';
import { esimAccessService } from '../services/esimAccessService';
import { qrCodeService } from '../services/qrCodeService';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const router = express.Router();

/**
 * GET /api/customer-orders/payment-intent/:paymentIntentId
 * Returns order status and a signed access token.
 */
router.get('/payment-intent/:paymentIntentId', async (req, res) => {
  try {
    const order = await customerOrderService.getByPaymentIntentId(req.params.paymentIntentId);
    if (!order) {
      return res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Order not found' });
    }

    const token = generateOrderToken(order.id, order.customerEmail);

    // Strip eSIM Access identifiers from customer-facing response
    res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        customerEmail: order.customerEmail,
        totalAmount: Number(order.totalAmount) / 100,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'FETCH_FAILED', errorMessage: error.message || 'Failed to fetch order' });
  }
});

/**
 * GET /api/customer-orders/:orderId?token=...
 * View full order details including eSIM profiles.
 * Auth: signed order token (from email link) OR customer JWT (from logged-in dashboard).
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { token } = req.query as { token?: string };

    const order = await customerOrderService.getById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Order not found' });
    }

    let authorized = false;

    // Auth method 1: Signed order token (from email link)
    if (token) {
      const claims = verifyOrderToken(token);
      if (claims && claims.orderId === req.params.orderId && claims.email.toLowerCase() === order.customerEmail.toLowerCase()) {
        authorized = true;
      }
    }

    // Auth method 2: Customer JWT (from logged-in dashboard)
    if (!authorized) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwtToken = authHeader.substring(7);
          const decoded = jwt.verify(jwtToken, env.jwtSecret) as { customerId?: string; email?: string };
          if (decoded.email && decoded.email.toLowerCase() === order.customerEmail.toLowerCase()) {
            authorized = true;
          }
        } catch {
          // JWT invalid — fall through to unauthorized
        }
      }
    }

    if (!authorized) {
      return res.status(401).json({ success: false, errorCode: 'TOKEN_REQUIRED', errorMessage: 'Access token is required. Check your order confirmation email or sign in.' });
    }

    // Strip eSIM Access identifiers from customer-facing response
    const { esimAccessOrderNo, ...safeOrder } = order as any;

    let qrCodes: string[] = [];
    let profiles: any[] = [];

    if (order.status === 'COMPLETED' && order.esimAccessOrderNo) {
      try {
        const profilesResult = await esimAccessService.queryProfiles({ orderNo: order.esimAccessOrderNo });
        if (profilesResult.success && profilesResult.obj?.esimList) {
          profiles = profilesResult.obj.esimList;
          qrCodes = await Promise.all(
            profiles.map(async (profile) =>
              qrCodeService.generateQRCode({
                esimTranNo: profile.esimTranNo,
                iccid: profile.iccid,
                imsi: profile.imsi,
                qrCodeUrl: profile.qrCodeUrl,
              })
            )
          );
        }
      } catch (error) {
        console.error('Error fetching profiles for order:', error);
      }
    }

    // Strip eSIM Access internal identifiers from profiles
    const safeProfiles = profiles.map((p: any) => ({
      iccid: p.iccid,
      imsi: p.imsi,
      esimStatus: p.esimStatus,
      smdpStatus: p.smdpStatus,
      packageName: p.packageName,
      coverage: p.coverage,
      data: p.data,
      validity: p.validity,
      // Keep QR code data but not raw eSIM Access URLs
    }));

    res.json({
      success: true,
      data: {
        ...safeOrder,
        totalAmount: Number(order.totalAmount) / 100,
        qrCodes,
        profiles: safeProfiles,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'FETCH_FAILED', errorMessage: error.message || 'Failed to fetch order' });
  }
});

/**
 * POST /api/customer-orders/:orderId/resend-email
 * Resend eSIM delivery email. Requires merchant authentication.
 */
router.post('/:orderId/resend-email', authenticateSessionOrJWT, async (req, res) => {
  try {
    const order = await customerOrderService.getById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, errorCode: 'ORDER_NOT_FOUND', errorMessage: 'Order not found' });
    }

    const merchantId = (req as any).merchant?.id;
    if (order.merchantId !== merchantId) {
      return res.status(403).json({ success: false, errorCode: 'UNAUTHORIZED', errorMessage: 'You do not own this order' });
    }

    if (!order.orderId) {
      return res.status(400).json({ success: false, errorCode: 'NO_MERCHANT_ORDER', errorMessage: 'Order not yet linked to a merchant order' });
    }

    await webhookService.deliverESIMs(order.orderId);
    res.json({ success: true, message: 'eSIM delivery email has been resent' });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'RESEND_FAILED', errorMessage: error.message || 'Failed to resend email' });
  }
});

export default router;
