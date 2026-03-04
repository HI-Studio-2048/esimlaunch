import express from 'express';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { env } from '../config/env';
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
    const { status, email, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) where.adminStatus = status;
    if (email) where.merchant = { email: { contains: email, mode: 'insensitive' } };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
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
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
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
    const { search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

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
        take: parseInt(limit),
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
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
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

    res.json({
      success: true,
      data: {
        ...merchant,
        stores: storesWithUrls,
        onboardingProgress: onboardingPref?.value ?? null,
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
    const { status, plan, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
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
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error?.message || 'Failed to fetch subscriptions',
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
    const { status, priority, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: parseInt(limit),
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
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
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
