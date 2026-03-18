import express from 'express';
import { webhookService } from '../services/webhookService';

const router = express.Router();

// Simple in-memory deduplication for webhook processing (prevents double-processing on retries)
const recentWebhooks = new Map<string, number>();
const WEBHOOK_DEDUP_WINDOW_MS = 60_000; // 1 minute

function getWebhookDedupeKey(webhook: any): string {
  // Use notifyId if provided by eSIM Access, otherwise hash key fields
  if (webhook.notifyId) return `id:${webhook.notifyId}`;
  return `${webhook.notifyType}:${webhook.content?.orderNo || ''}:${webhook.content?.orderStatus || ''}:${webhook.content?.esimTranNo || ''}`;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - WEBHOOK_DEDUP_WINDOW_MS;
  for (const [key, ts] of recentWebhooks) {
    if (ts < cutoff) recentWebhooks.delete(key);
  }
}, 5 * 60_000);

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

  // Extract IPv4 from IPv4-mapped IPv6 (e.g., "::ffff:3.1.131.226" -> "3.1.131.226")
  const normalizedIP = clientIP.replace(/^.*:ffff:/, '');

  // Check if IP is in whitelist (exact match)
  const isAllowed = ESIM_ACCESS_IPS.includes(normalizedIP);

  if (!isAllowed) {
    console.warn(`Webhook from unauthorized IP: ${clientIP} (normalized: ${normalizedIP})`);
    return res.status(403).json({
      success: false,
      errorCode: 'UNAUTHORIZED_IP',
      errorMessage: 'Unauthorized IP address'
    });
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

    // Deduplicate: skip if we've seen this webhook recently
    const dedupeKey = getWebhookDedupeKey(webhook);
    if (recentWebhooks.has(dedupeKey)) {
      return res.json({ success: true, message: 'Webhook already processed (deduplicated)' });
    }
    recentWebhooks.set(dedupeKey, Date.now());

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













