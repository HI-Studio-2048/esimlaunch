import express from 'express';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { env, STRIPE_API_VERSION } from '../config/env';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * Require that the authenticated user has the ADMIN role.
 * Must be used after authenticateSessionOrJWT.
 */
function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const isAdmin =
    req.merchant?.role === 'ADMIN' ||
    req.merchant?.email?.toLowerCase() === env.adminEmail.toLowerCase();
  if (!isAdmin) {
    res.status(403).json({
      success: false,
      errorCode: 'FORBIDDEN',
      errorMessage: 'Admin access only',
    });
    return;
  }
  next();
}

router.use(authenticateSessionOrJWT);
router.use(requireAdmin);

/* ─── Summary ───────────────────────────────────────────────── */

/**
 * GET /api/admin/summary
 * High-level platform KPIs for the admin home dashboard.
 */
router.get('/summary', async (_req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalMerchants,
      activeMerchants,
      totalStores,
      newMerchantsLast7,
      newMerchantsLast30,
      newStoresLast7,
      activeSubscriptions,
      todayNewMerchants,
      todayNewStores,
      openTickets,
    ] = await Promise.all([
      prisma.merchant.count(),
      prisma.merchant.count({ where: { isActive: true } }),
      prisma.store.count(),
      prisma.merchant.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.merchant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.store.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.merchant.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.store.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    ]);

    const todayMerchantsList = await prisma.merchant.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { id: true, email: true, name: true, serviceType: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const todayStoresList = await prisma.store.findMany({
      where: { createdAt: { gte: todayStart } },
      select: {
        id: true,
        name: true,
        businessName: true,
        subdomain: true,
        adminStatus: true,
        createdAt: true,
        merchant: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalMerchants,
          activeMerchants,
          totalStores,
          activeSubscriptions,
          newMerchantsLast7,
          newMerchantsLast30,
          newStoresLast7,
          openTickets,
        },
        today: {
          newMerchants: todayNewMerchants,
          newStores: todayNewStores,
          merchants: todayMerchantsList,
          stores: todayStoresList,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch summary',
    });
  }
});

/* ─── Store requests ─────────────────────────────────────────── */

/**
 * GET /api/admin/store-requests
 * List all stores with merchant info, pagination, and optional filters.
 */
router.get('/store-requests', async (req, res) => {
  try {
    const { status, email } = req.query as Record<string, string>;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.adminStatus = status;
    if (email) where.merchant = { email: { contains: email, mode: 'insensitive' } };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          businessName: true,
          subdomain: true,
          domain: true,
          adminStatus: true,
          adminNotes: true,
          isActive: true,
          domainVerified: true,
          templateKey: true,
          createdAt: true,
          updatedAt: true,
          merchant: {
            select: {
              id: true,
              email: true,
              name: true,
              serviceType: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    res.json({
      success: true,
      data: stores,
      meta: { total, page, limit },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch store requests',
    });
  }
});

/**
 * PATCH /api/admin/store-requests/:id
 * Update adminStatus and/or adminNotes on a store.
 */
router.patch('/store-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminStatus, adminNotes } = req.body;

    const validStatuses = ['pending_review', 'in_progress', 'completed', 'rejected'];
    if (adminStatus && !validStatuses.includes(adminStatus)) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_STATUS',
        errorMessage: `adminStatus must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const store = await prisma.store.update({
      where: { id },
      data: {
        ...(adminStatus !== undefined && { adminStatus }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        adminStatus: true,
        adminNotes: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'UPDATE_FAILED',
      errorMessage: error?.message || 'Failed to update store request',
    });
  }
});

/* ─── Merchants ──────────────────────────────────────────────── */

/**
 * GET /api/admin/merchants
 * Paginated list of all merchants with basic stats.
 */
router.get('/merchants', async (req, res) => {
  try {
    const { search } = req.query as Record<string, string>;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          serviceType: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: { stores: true, orders: true, supportTickets: true },
          },
          subscription: {
            select: { plan: true, billingPeriod: true, status: true, currentPeriodEnd: true },
          },
        },
      }),
      prisma.merchant.count({ where }),
    ]);

    res.json({
      success: true,
      data: merchants,
      meta: { total, page, limit },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch merchants',
    });
  }
});

/**
 * GET /api/admin/merchants/:merchantId
 * Detailed view for a single merchant.
 */
router.get('/merchants/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        serviceType: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        referralCode: true,
        referredBy: true,
        affiliateHandle: true,
        affiliateTier: true,
        subscription: {
          select: {
            plan: true,
            billingPeriod: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
          },
        },
        stores: {
          select: {
            id: true,
            name: true,
            businessName: true,
            subdomain: true,
            domain: true,
            templateKey: true,
            isActive: true,
            domainVerified: true,
            adminStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        supportTickets: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        preferences: {
          select: { key: true, value: true },
        },
        _count: {
          select: { orders: true, apiKeys: true },
        },
      },
    });

    if (!merchant) {
      res.status(404).json({
        success: false,
        errorCode: 'MERCHANT_NOT_FOUND',
        errorMessage: 'Merchant not found',
      });
      return;
    }

    // Compute store URLs
    const storesWithUrls = merchant.stores.map((s) => ({
      ...s,
      subdomainUrl: s.subdomain ? `https://${s.subdomain}.${env.mainDomain}` : null,
      customDomainUrl: s.domain ? `https://${s.domain}` : null,
    }));

    // Extract onboarding progress from preferences
    const onboardingPref = merchant.preferences.find((p) => p.key === 'onboarding_progress');

    // Resolve who referred this merchant (if any)
    const referredByMerchant = merchant.referredBy
      ? await prisma.merchant.findUnique({
          where: { id: merchant.referredBy },
          select: { id: true, email: true, name: true, affiliateHandle: true },
        })
      : null;

    // Find merchants this person referred + their active status
    const referredList = await prisma.merchant.findMany({
      where: { referredBy: merchant.id },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    let referrals: Array<{
      id: string;
      email: string;
      name: string | null;
      signedUpAt: Date;
      active: boolean;
    }> = [];

    if (referredList.length > 0) {
      const referredIds = referredList.map((m) => m.id);
      const activeRows = await prisma.affiliateCommission.findMany({
        where: {
          affiliateId: merchant.id,
          type: 'subscription',
          status: { not: 'cancelled' },
          referredMerchantId: { in: referredIds },
        },
        select: { referredMerchantId: true },
        distinct: ['referredMerchantId'],
      });
      const activeSet = new Set(activeRows.map((r) => r.referredMerchantId));
      referrals = referredList.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        signedUpAt: m.createdAt,
        active: activeSet.has(m.id),
      }));
    }

    res.json({
      success: true,
      data: {
        ...merchant,
        stores: storesWithUrls,
        onboardingProgress: onboardingPref?.value ?? null,
        referredByMerchant,
        referrals,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch merchant',
    });
  }
});

/* ─── Store detail ───────────────────────────────────────────── */

/**
 * GET /api/admin/stores/:storeId
 * Detailed view for a single store (admin).
 */
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            name: true,
            serviceType: true,
            isActive: true,
            subscription: {
              select: { plan: true, status: true },
            },
          },
        },
      },
    });

    if (!store) {
      res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...store,
        subdomainUrl: store.subdomain ? `https://${store.subdomain}.${env.mainDomain}` : null,
        customDomainUrl: store.domain ? `https://${store.domain}` : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch store',
    });
  }
});

/* ─── Subscriptions ──────────────────────────────────────────── */

/**
 * GET /api/admin/subscriptions
 * Overview of all subscriptions joined to merchants.
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const { status, plan } = req.query as Record<string, string>;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          merchant: {
            select: { id: true, email: true, name: true, isActive: true },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: subscriptions,
      meta: { total, page, limit },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch subscriptions',
    });
  }
});

/* ─── Affiliates (clicks + conversions) ─────────────────────── */

/**
 * GET /api/admin/affiliates
 * Per-affiliate breakdown of link clicks, signups, and earnings.
 * Sorted by total clicks desc by default. Only includes merchants who
 * have a referralCode (i.e. could have generated traffic).
 */
router.get('/affiliates', async (req, res) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 100), 500);
    const sort = (req.query.sort as string) || 'clicks';
    const search = (req.query.search as string)?.trim().toLowerCase();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const merchantWhere: any = { referralCode: { not: null } };
    if (search) {
      merchantWhere.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { affiliateHandle: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const merchants = await prisma.merchant.findMany({
      where: merchantWhere,
      select: {
        id: true,
        email: true,
        name: true,
        referralCode: true,
        affiliateHandle: true,
        affiliateTier: true,
        createdAt: true,
      },
    });

    if (merchants.length === 0) {
      return res.json({ success: true, data: [], meta: { total: 0 } });
    }

    const merchantIds = merchants.map((m) => m.id);

    const [clicksAll, clicks30, signupCounts, earnings] = await Promise.all([
      prisma.affiliateClick.groupBy({
        by: ['merchantId'],
        where: { merchantId: { in: merchantIds } },
        _count: { _all: true },
      }),
      prisma.affiliateClick.groupBy({
        by: ['merchantId'],
        where: { merchantId: { in: merchantIds }, createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),
      prisma.merchant.groupBy({
        by: ['referredBy'],
        where: { referredBy: { in: merchantIds } },
        _count: { _all: true },
      }),
      prisma.affiliateCommission.groupBy({
        by: ['affiliateId'],
        where: { affiliateId: { in: merchantIds }, status: 'paid' },
        _sum: { amount: true },
      }),
    ]);

    const clicksAllMap = new Map(clicksAll.map((r) => [r.merchantId, r._count._all]));
    const clicks30Map = new Map(clicks30.map((r) => [r.merchantId, r._count._all]));
    const signupMap = new Map(signupCounts.map((r) => [r.referredBy!, r._count._all]));
    const earningsMap = new Map(earnings.map((r) => [r.affiliateId, Number(r._sum.amount ?? 0n) / 100]));

    const rows = merchants.map((m) => {
      const clicksAllTime = clicksAllMap.get(m.id) ?? 0;
      const referredMerchants = signupMap.get(m.id) ?? 0;
      return {
        id: m.id,
        email: m.email,
        name: m.name,
        handle: m.affiliateHandle,
        tier: m.affiliateTier,
        referralCode: m.referralCode,
        joinedAt: m.createdAt,
        clicksAllTime,
        clicks30d: clicks30Map.get(m.id) ?? 0,
        referredMerchants,
        conversionRate: clicksAllTime > 0
          ? Number(((referredMerchants / clicksAllTime) * 100).toFixed(2))
          : 0,
        totalEarnings: earningsMap.get(m.id) ?? 0,
      };
    });

    const sortKey =
      sort === 'signups' ? 'referredMerchants'
      : sort === 'earnings' ? 'totalEarnings'
      : sort === 'conversion' ? 'conversionRate'
      : sort === 'clicks30' ? 'clicks30d'
      : 'clicksAllTime';
    rows.sort((a, b) => (b as any)[sortKey] - (a as any)[sortKey]);

    res.json({
      success: true,
      data: rows.slice(0, limit),
      meta: { total: rows.length },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch affiliate stats',
    });
  }
});

/**
 * DELETE /api/admin/merchants/:merchantId
 * Hard-delete a merchant: cancel Stripe subscription, delete Stripe customer,
 * delete Clerk user, then delete the DB row. Prisma cascades clean up the rest.
 *
 * External-system failures (Stripe/Clerk) are logged and reported but do NOT
 * block the DB delete — admin can follow up manually if needed.
 */
router.delete('/merchants/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const adminId = (req as any).merchant!.id;

    if (merchantId === adminId) {
      res.status(400).json({
        success: false,
        errorCode: 'CANNOT_DELETE_SELF',
        errorMessage: 'You cannot delete your own admin account.',
      });
      return;
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        email: true,
        clerkUserId: true,
        subscription: { select: { stripeSubscriptionId: true, stripeCustomerId: true } },
      },
    });

    if (!merchant) {
      res.status(404).json({ success: false, errorCode: 'MERCHANT_NOT_FOUND', errorMessage: 'Merchant not found' });
      return;
    }

    const report: { stripe: string; clerk: string } = { stripe: 'skipped', clerk: 'skipped' };
    const { logger } = await import('../lib/logger');

    // 1. Stripe — cancel sub + delete customer
    if (merchant.subscription?.stripeSubscriptionId || merchant.subscription?.stripeCustomerId) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(env.stripeSecretKey, { apiVersion: STRIPE_API_VERSION as any });

        if (merchant.subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(merchant.subscription.stripeSubscriptionId);
          } catch (err: any) {
            // Sub may already be cancelled / not exist — non-fatal
            logger.warn({ err, merchantId }, 'stripe sub cancel failed during delete');
          }
        }
        if (merchant.subscription.stripeCustomerId) {
          await stripe.customers.del(merchant.subscription.stripeCustomerId);
        }
        report.stripe = 'cleaned';
      } catch (err: any) {
        logger.error({ err, merchantId }, 'stripe cleanup failed during merchant delete');
        report.stripe = `failed: ${err?.message || 'unknown error'}`;
      }
    }

    // 2. Clerk — delete user
    if (merchant.clerkUserId) {
      try {
        const { clerkClient } = await import('@clerk/clerk-sdk-node');
        await clerkClient.users.deleteUser(merchant.clerkUserId);
        report.clerk = 'deleted';
      } catch (err: any) {
        logger.error({ err, merchantId }, 'clerk delete failed during merchant delete');
        report.clerk = `failed: ${err?.message || 'unknown error'}`;
      }
    }

    // 3. DB — cascades wipe stores, orders, commissions, clicks, etc.
    await prisma.merchant.delete({ where: { id: merchantId } });

    logger.info({ merchantId, email: merchant.email, adminId, report }, 'merchant deleted by admin');

    res.json({
      success: true,
      message: `Merchant ${merchant.email} deleted.`,
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'DELETE_FAILED',
      errorMessage: error?.message || 'Failed to delete merchant',
    });
  }
});

/**
 * GET /api/admin/affiliates/:merchantId/referrals
 * List of merchants referred by a specific affiliate (admin view).
 */
router.get('/affiliates/:merchantId/referrals', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const referred = await prisma.merchant.findMany({
      where: { referredBy: merchantId },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (referred.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const referredIds = referred.map((r) => r.id);
    const activeRows = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: merchantId,
        type: 'subscription',
        status: { not: 'cancelled' },
        referredMerchantId: { in: referredIds },
      },
      select: { referredMerchantId: true },
      distinct: ['referredMerchantId'],
    });
    const activeSet = new Set(activeRows.map((r) => r.referredMerchantId));

    res.json({
      success: true,
      data: referred.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        signedUpAt: m.createdAt,
        active: activeSet.has(m.id),
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch affiliate referrals',
    });
  }
});

/* ─── Support tickets (overview) ────────────────────────────── */

/**
 * GET /api/admin/support
 * Overview of open support tickets (oldest unresolved + high-priority).
 */
router.get('/support', async (req, res) => {
  try {
    const { status, priority } = req.query as Record<string, string>;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          ticketNumber: true,
          customerEmail: true,
          customerName: true,
          subject: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          merchant: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
      meta: { total, page, limit },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch support tickets',
    });
  }
});

export default router;
