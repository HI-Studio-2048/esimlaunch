import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { prisma } from '../lib/prisma';
import { ServiceType } from '@prisma/client';
import { domainVerificationService } from '../services/domainVerificationService';
import { esimAccessService } from '../services/esimAccessService';
import { emailService } from '../services/emailService';
import { env } from '../config/env';

const router = express.Router();

// Helper: apply merchant markup to a base price (USD)
function applyMarkup(basePrice: number, pricingMarkup: any, locationCode: string, packageCode: string): number {
  if (!pricingMarkup) return Math.round(basePrice * 100) / 100;
  if (pricingMarkup.packages && pricingMarkup.packages[packageCode] !== undefined) {
    const rate = Number(pricingMarkup.packages[packageCode]);
    return Math.round(basePrice * (1 + rate / 100) * 100) / 100;
  }
  if (pricingMarkup.countries && pricingMarkup.countries[locationCode] !== undefined) {
    const rate = Number(pricingMarkup.countries[locationCode]);
    return Math.round(basePrice * (1 + rate / 100) * 100) / 100;
  }
  const globalRate = Number(pricingMarkup.global ?? pricingMarkup.globalMarkup ?? 0);
  return Math.round(basePrice * (1 + globalRate / 100) * 100) / 100;
}

// Helper: convert bytes to human-readable data size
function formatDataSize(bytes: number): string {
  if (!bytes) return 'Unlimited';
  if (bytes >= 1073741824) return `${Math.round(bytes / 1073741824)}GB`;
  if (bytes >= 1048576) return `${Math.round(bytes / 1048576)}MB`;
  return `${bytes}B`;
}

// Helper: create slug from location name (matches esimlaunch-template format)
function makeLocationSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-esim';
}

// Helper: store is accessible via public API (isActive or admin workflow in_progress/completed)
function isStorePubliclyAccessible(store: { isActive: boolean; adminStatus?: string | null }): boolean {
  if (store.isActive) return true;
  const status = store.adminStatus ?? '';
  return status === 'in_progress' || status === 'completed';
}

// Helper: build store public response (packages, packagesTemplate, locations)
async function buildStorePublicResponse(store: any) {
  let packages: any[] = [];
  let packagesTemplate: any[] = [];
  const locationsMap = new Map<string, { code: string; name: string }>();

  try {
    const result = await esimAccessService.getPackages();
    if (result.success && result.obj?.packageList) {
      let allPackages = result.obj.packageList;
      const selectedPackages = store.selectedPackages as string[] | null;
      if (selectedPackages && selectedPackages.length > 0) {
        const filtered = allPackages.filter((pkg: any) =>
          selectedPackages.includes(pkg.packageCode) || selectedPackages.includes(pkg.slug)
        );
        // Fallback: if filter matches nothing (e.g. format mismatch), use all packages
        allPackages = filtered.length > 0 ? filtered : allPackages;
      }
      const pricingMarkup = store.pricingMarkup as any;

      for (const pkg of allPackages) {
        // eSIM Access may return price in provider units (1/10000 USD) or in USD; detect by magnitude
        const rawPrice = typeof pkg.price === 'number' ? pkg.price : 0;
        const basePrice =
          rawPrice > 0 && rawPrice < 100
            ? rawPrice
            : rawPrice / 10000; // Values < 100 likely USD (e.g. 7.13); else provider units
        const finalPriceUsd = applyMarkup(basePrice, pricingMarkup, pkg.locationCode, pkg.packageCode);
        const priceProviderUnits = Math.round(finalPriceUsd * 10000);

        packages.push({
          packageCode: pkg.packageCode,
          slug: pkg.slug,
          name: pkg.name,
          data: formatDataSize(pkg.volume),
          validity: `${pkg.duration} ${pkg.durationUnit}`,
          price: finalPriceUsd,
          currency: 'USD',
          location: pkg.location,
          locationCode: pkg.locationCode,
          activeType: pkg.activeType,
          dataType: pkg.dataType,
        });

        packagesTemplate.push({
          packageCode: pkg.packageCode,
          slug: pkg.slug,
          name: pkg.name,
          location: pkg.location,
          locationCode: pkg.locationCode,
          volume: pkg.volume >= 1048576 ? Math.round(pkg.volume / 1048576) : pkg.volume,
          duration: pkg.duration ?? 0,
          durationUnit: (pkg.durationUnit ?? 'day').toString().toLowerCase().replace(/s$/, '') === 'month' ? 'month' : 'day',
          price: priceProviderUnits,
          currencyCode: pkg.currencyCode ?? 'USD',
          supportTopUpType: typeof pkg.supportTopUpType === 'string' ? parseInt(pkg.supportTopUpType, 10) : (pkg.supportTopUpType ?? 0),
        });

        if (pkg.locationCode && pkg.location) {
          locationsMap.set(pkg.locationCode, { code: pkg.locationCode, name: pkg.location });
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch eSIM Access packages:', err);
  }

  const locations = Array.from(locationsMap.values()).map(({ code, name }) => ({
    code,
    name,
    type: 1 as const,
    slug: makeLocationSlug(name),
  }));

  return {
    branding: {
      businessName: store.businessName,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      accentColor: store.accentColor,
      logoUrl: store.logoUrl || null,
    },
    packages,
    packagesTemplate,
    locations,
    currency: store.defaultCurrency || 'USD',
    templateKey: store.templateKey || 'default',
    templateSettings: (store.templateSettings as object) || undefined,
  };
}

/**
 * GET /api/stores/:storeId/public
 * Public endpoint — no authentication required.
 * Returns store branding and packages with markup applied.
 */
router.get('/:storeId/public', async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        businessName: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        selectedPackages: true,
        pricingMarkup: true,
        defaultCurrency: true,
        isActive: true,
        adminStatus: true,
        templateKey: true,
        templateSettings: true,
      },
    });

    if (!store || !isStorePubliclyAccessible(store)) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    const data = await buildStorePublicResponse(store);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch store data',
    });
  }
});

/**
 * GET /api/stores/by-subdomain/:subdomain
 * Public endpoint — no authentication required.
 * Looks up a store by its subdomain and returns the same shape as /:storeId/public.
 */
router.get('/by-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    const store = await prisma.store.findUnique({
      where: { subdomain },
      select: {
        id: true,
        businessName: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        selectedPackages: true,
        pricingMarkup: true,
        defaultCurrency: true,
        isActive: true,
        adminStatus: true,
        templateKey: true,
        templateSettings: true,
      },
    });

    if (!store || !isStorePubliclyAccessible(store)) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    const data = await buildStorePublicResponse(store);
    res.json({ success: true, data: { storeId: store.id, ...data } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch store data',
    });
  }
});

// All routes below require JWT authentication
router.use(authenticateSessionOrJWT);

// Validation schemas
const templateSettingsSchema = z.object({
  heroStyle: z.enum(['gradient', 'minimal', 'image', 'split']).optional(),
  showTestimonials: z.boolean().optional(),
  showFeatures: z.boolean().optional(),
  showEsimInfo: z.boolean().optional(),
  heroHeadline: z.string().max(120).optional(),
  heroSubheadline: z.string().max(200).optional(),
  // Contact page content
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  contactAddress: z.string().max(200).optional(),
  contactHours: z.string().max(100).optional(),
  // About page content
  aboutTagline: z.string().max(200).optional(),
  aboutMission: z.string().max(1000).optional(),
  // FAQ content
  faqs: z.array(z.object({
    question: z.string().min(1).max(300),
    answer: z.string().min(1).max(1000),
  })).max(20).optional(),
  // Legal pages
  legalCompanyName: z.string().max(100).optional(),
  legalLastUpdated: z.string().max(50).optional(),
}).optional();

const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  domain: z.string().optional(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens').optional(),
  businessName: z.string().min(1, 'Business name is required'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  logoUrl: z.union([z.string().url(), z.string().startsWith('data:')]).optional(),
  selectedPackages: z.array(z.string()).optional(),
  pricingMarkup: z.record(z.any()).optional(),
  templateKey: z.enum(['default', 'minimal', 'bold', 'travel']).optional(),
  templateSettings: templateSettingsSchema.optional(),
});

const updateStoreSchema = createStoreSchema.partial();

/**
 * POST /api/stores
 * Create a new store for Easy Way merchant
 */
router.post('/', async (req, res, next) => {
  try {
    // Check if merchant is Easy Way type
    if (req.merchant!.serviceType !== ServiceType.EASY) {
      return res.status(403).json({
        success: false,
        errorCode: 'SERVICE_TYPE_MISMATCH',
        errorMessage: 'Store builder is only available for Easy Way merchants',
      });
    }

    const data = createStoreSchema.parse(req.body);

    // Check if subdomain or domain is already taken
    if (data.subdomain) {
      const existing = await prisma.store.findUnique({
        where: { subdomain: data.subdomain },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          errorCode: 'SUBDOMAIN_TAKEN',
          errorMessage: 'Subdomain is already taken',
        });
      }
    }

    if (data.domain) {
      const existing = await prisma.store.findUnique({
        where: { domain: data.domain },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          errorCode: 'DOMAIN_TAKEN',
          errorMessage: 'Domain is already taken',
        });
      }
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        merchantId: req.merchant!.id,
        name: data.name,
        domain: data.domain || null,
        subdomain: data.subdomain || null,
        businessName: data.businessName,
        primaryColor: data.primaryColor || '#6366f1',
        secondaryColor: data.secondaryColor || '#8b5cf6',
        accentColor: data.accentColor || '#22c55e',
        logoUrl: data.logoUrl || null,
        selectedPackages: data.selectedPackages || [],
        pricingMarkup: data.pricingMarkup || {},
        templateKey: data.templateKey || 'default',
        templateSettings: data.templateSettings ?? undefined,
      },
    });

    // Notify admin of new store request (non-blocking)
    emailService.sendAdminNotification({
      subject: `[eSIMLaunch] New store request: ${data.businessName}`,
      html: `
        <p>A new eSIM store has been submitted.</p>
        <ul>
          <li><strong>Business name:</strong> ${data.businessName}</li>
          <li><strong>Store name:</strong> ${data.name}</li>
          <li><strong>Subdomain:</strong> ${data.subdomain || '—'}</li>
          <li><strong>Merchant email:</strong> ${req.merchant!.email}</li>
          <li><strong>Store ID:</strong> ${store.id}</li>
          <li><strong>Created:</strong> ${store.createdAt.toISOString()}</li>
        </ul>
        <p>View all store requests in the <a href="${env.frontendUrl}/admin">Admin dashboard</a>.</p>
      `,
    }).catch((err) => console.error('Admin notification email failed:', err));

    res.json({
      success: true,
      data: store,
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
        errorCode: 'STORE_CREATION_FAILED',
        errorMessage: error.message || 'Failed to create store',
      });
    }
  }
});

/**
 * GET /api/stores
 * List all stores for the merchant
 */
router.get('/', async (req, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      where: {
        merchantId: req.merchant!.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: stores,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch stores',
    });
  }
});

/**
 * GET /api/stores/:storeId
 * Get store details
 */
router.get('/:storeId', async (req, res, next) => {
  try {
    const store = await prisma.store.findFirst({
      where: {
        id: req.params.storeId,
        merchantId: req.merchant!.id,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    res.json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch store',
    });
  }
});

/**
 * PUT /api/stores/:storeId
 * Update store configuration
 */
router.put('/:storeId', async (req, res, next) => {
  try {
    // Verify store belongs to merchant
    const existingStore = await prisma.store.findFirst({
      where: {
        id: req.params.storeId,
        merchantId: req.merchant!.id,
      },
    });

    if (!existingStore) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    const data = updateStoreSchema.parse(req.body);

    // Check if new subdomain/domain is taken (if being changed)
    if (data.subdomain && data.subdomain !== existingStore.subdomain) {
      const existing = await prisma.store.findUnique({
        where: { subdomain: data.subdomain },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          errorCode: 'SUBDOMAIN_TAKEN',
          errorMessage: 'Subdomain is already taken',
        });
      }
    }

    if (data.domain && data.domain !== existingStore.domain) {
      const existing = await prisma.store.findUnique({
        where: { domain: data.domain },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          errorCode: 'DOMAIN_TAKEN',
          errorMessage: 'Domain is already taken',
        });
      }
    }

    // Update store
    const store = await prisma.store.update({
      where: { id: req.params.storeId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: store,
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
        errorCode: 'UPDATE_FAILED',
        errorMessage: error.message || 'Failed to update store',
      });
    }
  }
});

/**
 * DELETE /api/stores/:storeId
 * Delete a store
 */
router.delete('/:storeId', async (req, res, next) => {
  try {
    // Verify store belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: req.params.storeId,
        merchantId: req.merchant!.id,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    await prisma.store.delete({
      where: { id: req.params.storeId },
    });

    res.json({
      success: true,
      message: 'Store deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'DELETE_FAILED',
      errorMessage: error.message || 'Failed to delete store',
    });
  }
});

/**
 * POST /api/stores/:storeId/verify-domain
 * Start domain verification process
 */
router.post('/:storeId/verify-domain', async (req, res, next) => {
  try {
    const storeId = req.params.storeId;
    const { domain, method } = z.object({
      domain: z.string().min(1, 'Domain is required'),
      method: z.enum(['dns', 'cname']).default('dns'),
    }).parse(req.body);

    // Verify store belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: req.merchant!.id,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    // Update store domain
    await prisma.store.update({
      where: { id: storeId },
      data: { domain },
    });

    // Generate verification token
    const verificationToken = await domainVerificationService.generateVerificationToken(storeId);

    // Get DNS instructions
    const instructions = domainVerificationService.getDNSInstructions(domain, verificationToken, storeId);

    res.json({
      success: true,
      data: {
        domain,
        verificationToken,
        instructions,
        method,
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
        errorCode: 'VERIFICATION_START_FAILED',
        errorMessage: error.message || 'Failed to start domain verification',
      });
    }
  }
});

/**
 * GET /api/stores/:storeId/domain-status
 * Get domain verification status
 */
router.get('/:storeId/domain-status', async (req, res, next) => {
  try {
    const storeId = req.params.storeId;

    // Verify store belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: req.merchant!.id,
      },
      select: {
        domain: true,
        domainVerified: true,
        domainVerificationMethod: true,
        domainVerificationToken: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    if (!store.domain) {
      return res.json({
        success: true,
        data: {
          domain: null,
          verified: false,
          method: null,
        },
      });
    }

    // Check verification status
    const verificationResult = await domainVerificationService.checkVerification(storeId, store.domain);

    res.json({
      success: true,
      data: {
        domain: store.domain,
        verified: verificationResult.verified,
        method: verificationResult.method,
        error: verificationResult.error,
        instructions: store.domainVerificationToken
          ? domainVerificationService.getDNSInstructions(
              store.domain,
              store.domainVerificationToken,
              storeId
            )
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch domain status',
    });
  }
});

/**
 * POST /api/stores/:storeId/verify-dns
 * Verify DNS records and complete verification
 */
router.post('/:storeId/verify-dns', async (req, res, next) => {
  try {
    const storeId = req.params.storeId;
    const { method } = z.object({
      method: z.enum(['dns', 'cname']).default('dns'),
    }).parse(req.body);

    // Verify store belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId: req.merchant!.id,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    if (!store.domain) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_DOMAIN',
        errorMessage: 'No domain configured for this store',
      });
    }

    // Verify domain
    const result = await domainVerificationService.verifyDomain(storeId, store.domain, method);

    res.json({
      success: result.verified,
      data: {
        verified: result.verified,
        method: result.method,
        error: result.error,
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
        errorCode: 'VERIFICATION_FAILED',
        errorMessage: error.message || 'Failed to verify domain',
      });
    }
  }
});

export default router;




