import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const router = express.Router();

function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return crypto
    .createHash('sha256')
    .update(`${ip}:${env.jwtSecret}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * GET /r/:code
 * Public referral redirect. Logs a click and 302s to the signup page
 * with ?ref=CODE so existing referral attribution still fires on signup.
 *
 * Failures to record the click never block the redirect — affiliates'
 * traffic must always reach the signup page.
 */
router.get('/r/:code', async (req, res) => {
  const code = req.params.code?.trim();
  const target = `${env.frontendUrl.replace(/\/$/, '')}/signup${code ? `?ref=${encodeURIComponent(code)}` : ''}`;

  if (!code) {
    return res.redirect(302, target);
  }

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (merchant) {
      const ua = (req.headers['user-agent'] as string | undefined) ?? null;
      const ref = (req.headers['referer'] as string | undefined) ?? null;
      const country = (req.headers['cf-ipcountry'] as string | undefined)
        ?? (req.headers['x-vercel-ip-country'] as string | undefined)
        ?? null;

      await prisma.affiliateClick.create({
        data: {
          merchantId: merchant.id,
          referralCode: code,
          ipHash: hashIp(req.ip),
          userAgent: ua ? ua.slice(0, 500) : null,
          referer: ref ? ref.slice(0, 500) : null,
          country: country ? country.slice(0, 8) : null,
        },
      });
    }
  } catch (err) {
    logger.error({ err, code }, 'failed to record affiliate click');
  }

  return res.redirect(302, target);
});

export default router;
