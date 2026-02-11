import express from 'express';
import { z } from 'zod';
import { customerOrderService } from '../services/customerOrderService';
import { webhookService } from '../services/webhookService';
import { esimAccessService } from '../services/esimAccessService';
import { qrCodeService } from '../services/qrCodeService';

const router = express.Router();

// Validation schemas
const getOrdersByEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * GET /api/customer-orders/:orderId
 * Get customer order by ID (public, no auth required)
 */
router.get('/:orderId', async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    
    const order = await customerOrderService.getById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    // If order is completed, fetch eSIM profiles and generate QR codes
    let qrCodes: string[] = [];
    let profiles: any[] = [];
    
    if (order.status === 'COMPLETED' && order.esimAccessOrderNo) {
      try {
        const profilesResult = await esimAccessService.queryProfiles({
          orderNo: order.esimAccessOrderNo,
        });

        if (profilesResult.success && profilesResult.obj?.esimList) {
          profiles = profilesResult.obj.esimList;
          qrCodes = await Promise.all(
            profiles.map(async (profile) => {
              return qrCodeService.generateQRCode({
                esimTranNo: profile.esimTranNo,
                iccid: profile.iccid,
                imsi: profile.imsi,
                qrCodeUrl: profile.qrCodeUrl,
              });
            })
          );
        }
      } catch (error) {
        console.error('Error fetching profiles for order:', error);
        // Don't fail the request if QR code generation fails
      }
    }

    res.json({
      success: true,
      data: {
        ...order,
        totalAmount: Number(order.totalAmount) / 100, // Convert from cents to dollars
        qrCodes,
        profiles,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch order',
    });
  }
});

/**
 * GET /api/customer-orders?email=...
 * Get customer orders by email (public, no auth required)
 */
router.get('/', async (req, res, next) => {
  try {
    const data = getOrdersByEmailSchema.parse(req.query);
    
    const orders = await customerOrderService.getByEmail(data.email);

    res.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount) / 100, // Convert from cents to dollars
      })),
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
        errorMessage: error.message || 'Failed to fetch orders',
      });
    }
  }
});

/**
 * GET /api/customer-orders/payment-intent/:paymentIntentId
 * Get customer order by payment intent ID
 */
router.get('/payment-intent/:paymentIntentId', async (req, res, next) => {
  try {
    const paymentIntentId = req.params.paymentIntentId;
    
    const order = await customerOrderService.getByPaymentIntentId(paymentIntentId);

    if (!order) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...order,
        totalAmount: Number(order.totalAmount) / 100, // Convert from cents to dollars
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch order',
    });
  }
});

/**
 * POST /api/customer-orders/:orderId/resend-email
 * Resend eSIM delivery email
 */
router.post('/:orderId/resend-email', async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    
    const order = await customerOrderService.getById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: 'Order not found',
      });
    }

    if (!order.orderId) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_MERCHANT_ORDER',
        errorMessage: 'Order is not yet linked to a merchant order',
      });
    }

    // Trigger eSIM delivery
    await webhookService.deliverESIMs(order.orderId);

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

export default router;

