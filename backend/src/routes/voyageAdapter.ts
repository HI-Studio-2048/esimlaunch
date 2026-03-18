/**
 * Voyage-compatible API adapter
 * Exposes endpoints that the Voyage cloned storefront expects so it can use
 * the esimlaunch backend instead of the Voyage NestJS backend.
 * Mount at /api/voyage - set Voyage NEXT_PUBLIC_API_URL to <esimlaunch>/api/voyage
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { esimAccessService } from '../services/esimAccessService';
import { prisma } from '../lib/prisma';
import { authenticateSessionOrApiKey } from '../middleware/auth';

const router = express.Router();

const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests per minute per IP
  message: { success: false, errorCode: 'RATE_LIMIT', errorMessage: 'Too many requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/voyage/countries
 * Returns location list (countries + regions) in Voyage shape.
 * Voyage expects array or { locationList: [...] } with { code, name, type }.
 */
router.get('/countries', publicApiLimiter, async (_req, res) => {
  try {
    const result = await esimAccessService.getRegions();
    if (!result.success || !result.obj) {
      console.warn('[Voyage adapter] GET /countries: eSIM Access returned no data', result);
      return res.json([]);
    }
    const list = Array.isArray(result.obj) ? result.obj : [];
    const locationList = list.map((r: { code?: string; name?: string; type?: number }) => ({
      code: r.code ?? '',
      name: r.name ?? '',
      type: r.type ?? 1,
    }));
    res.json(locationList);
  } catch (error: any) {
    console.error('[Voyage adapter] GET /countries:', error?.response?.data ?? error?.message ?? error);
    res.json([]);
  }
});

/**
 * GET /api/voyage/countries/:code/plans
 * Returns package list for a country/region in Voyage plan shape.
 * Price is converted from 1/10000 USD to USD for display.
 */
router.get('/countries/:code/plans', publicApiLimiter, async (req, res) => {
  try {
    const { code } = req.params;
    const result = await esimAccessService.getPackages({ locationCode: code, type: 'BASE' });
    if (!result.success || !result.obj?.packageList) {
      return res.json([]);
    }
    const packageList = result.obj.packageList.map((pkg: any) => ({
      packageCode: pkg.packageCode,
      slug: pkg.slug,
      name: pkg.name,
      price: typeof pkg.price === 'number' ? pkg.price / 10000 : 0,
      currencyCode: pkg.currencyCode || 'USD',
      volume: pkg.volume ?? 0,
      duration: pkg.duration ?? 0,
      durationUnit: pkg.durationUnit || 'day',
      location: pkg.location || pkg.locationCode || '',
      locationCode: pkg.locationCode || '',
      activeType: pkg.activeType,
      dataType: pkg.dataType,
      supportTopUpType: pkg.supportTopUpType,
    }));
    res.json(packageList);
  } catch (error: any) {
    console.error('[Voyage adapter] GET /countries/:code/plans:', error);
    res.status(500).json({ errorCode: 'FETCH_FAILED', message: error?.message || 'Failed to fetch plans' });
  }
});

/**
 * GET /api/voyage/esim/:iccid
 * Returns eSIM profile by ICCID for QR/display. Used by Voyage my-esims and QR image proxy.
 * Looks up in our EsimProfile table (any merchant) for testing.
 */
router.get('/esim/:iccid', authenticateSessionOrApiKey, async (req, res) => {
  try {
    const { iccid } = req.params;
    const profile = await prisma.esimProfile.findFirst({
      where: { iccid: iccid || undefined, merchantId: req.merchant!.id },
      select: {
        id: true,
        esimTranNo: true,
        iccid: true,
        ac: true,
        qrCodeUrl: true,
        shortUrl: true,
        esimStatus: true,
        smdpStatus: true,
        packageCode: true,
        packageName: true,
        locationCode: true,
        orderedAt: true,
      },
    });
    if (!profile) {
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Profile not found' });
    }
    res.json({
      ...profile,
      expiredTime: null,
      totalVolume: null,
      orderUsage: null,
      orderedAt: profile.orderedAt?.toISOString() ?? null,
    });
  } catch (error: any) {
    console.error('[Voyage adapter] GET /esim/:iccid:', error);
    res.status(500).json({ errorCode: 'FETCH_FAILED', message: error?.message || 'Failed to fetch profile' });
  }
});

/**
 * GET /api/voyage/plans/:id
 * Single plan by packageCode or slug (Voyage plan detail page).
 */
router.get('/plans/:id', publicApiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await esimAccessService.getPackages({ type: 'BASE', packageCode: id, slug: id });
    if (!result.success || !result.obj?.packageList?.length) {
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Plan not found' });
    }
    const pkg = result.obj.packageList[0];
    res.json({
      packageCode: pkg.packageCode,
      slug: pkg.slug,
      name: pkg.name,
      price: typeof pkg.price === 'number' ? pkg.price / 10000 : 0,
      currencyCode: pkg.currencyCode || 'USD',
      volume: pkg.volume ?? 0,
      duration: pkg.duration ?? 0,
      durationUnit: pkg.durationUnit || 'day',
      location: pkg.location || pkg.locationCode || '',
      locationCode: pkg.locationCode || '',
      activeType: pkg.activeType,
      dataType: pkg.dataType,
      supportTopUpType: pkg.supportTopUpType,
    });
  } catch (error: any) {
    console.error('[Voyage adapter] GET /plans/:id:', error);
    res.status(500).json({ errorCode: 'FETCH_FAILED', message: error?.message || 'Failed to fetch plan' });
  }
});

/**
 * GET /api/voyage/search?q=...
 * Voyage global search - returns { countries, plans }.
 */
router.get('/search', publicApiLimiter, async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      return res.json({ countries: [], plans: [] });
    }
    const [regionsRes, packagesRes] = await Promise.all([
      esimAccessService.getRegions(),
      esimAccessService.getPackages({ type: 'BASE' }),
    ]);
    const countries = (regionsRes.success && regionsRes.obj
      ? regionsRes.obj.filter((r: { name: string; code: string }) =>
          r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase())
        )
      : []
    ).map((r: { code: string; name: string; type: number }) => ({ code: r.code, name: r.name, type: r.type }));

    const plans = (packagesRes.success && packagesRes.obj?.packageList
      ? packagesRes.obj.packageList.filter(
          (p: { name?: string; location?: string; locationCode?: string }) =>
            [p.name, p.location, p.locationCode].some(
              (v) => typeof v === 'string' && v.toLowerCase().includes(q.toLowerCase())
            )
        )
      : []
    ).map((pkg: any) => ({
      packageCode: pkg.packageCode,
      slug: pkg.slug,
      name: pkg.name,
      price: typeof pkg.price === 'number' ? pkg.price / 10000 : 0,
      currencyCode: pkg.currencyCode || 'USD',
      volume: pkg.volume ?? 0,
      duration: pkg.duration ?? 0,
      durationUnit: pkg.durationUnit || 'day',
      location: pkg.location || pkg.locationCode || '',
      locationCode: pkg.locationCode || '',
    }));

    res.json({ countries, plans });
  } catch (error: any) {
    console.error('[Voyage adapter] GET /search:', error);
    res.status(500).json({ errorCode: 'FETCH_FAILED', message: error?.message || 'Search failed' });
  }
});

export default router;
