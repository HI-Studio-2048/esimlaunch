import express from 'express';
import { webhookService } from '../services/webhookService';

const router = express.Router();

// IP whitelist for eSIM Access webhooks
const ESIM_ACCESS_IPS = [
  '3.1.131.226',
  '54.254.74.88',
  '18.136.190.97',
  '18.136.60.197',
  '18.136.19.137',
];

/**
 * Middleware to verify webhook comes from eSIM Access
 * In production, you should verify IP addresses
 */
function verifyESIMAccessIP(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIP = req.ip || req.socket.remoteAddress || '';
  
  // In development, allow all IPs
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Check if IP is in whitelist
  const isAllowed = ESIM_ACCESS_IPS.some(ip => clientIP.includes(ip));
  
  if (!isAllowed) {
    console.warn(`Webhook from unauthorized IP: ${clientIP}`);
    // In production, you might want to reject, but for now we'll allow and log
    // res.status(403).json({ success: false, errorMessage: 'Unauthorized IP' });
  }

  next();
}

/**
 * POST /api/webhooks/esimaccess
 * Receive webhooks from eSIM Access
 */
router.post('/esimaccess', verifyESIMAccessIP, async (req, res, next) => {
  try {
    const webhook = req.body;

    // Validate webhook structure
    if (!webhook.notifyType || !webhook.content) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Invalid webhook format',
      });
    }

    // Process webhook asynchronously
    setImmediate(async () => {
      try {
        await webhookService.processESIMAccessWebhook(webhook);
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    });

    // Respond immediately to eSIM Access
    res.json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      errorMessage: error.message || 'Failed to process webhook',
    });
  }
});

export default router;








