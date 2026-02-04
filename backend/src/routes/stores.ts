import express from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { prisma } from '../lib/prisma';
import { ServiceType } from '@prisma/client';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateJWT);

// Validation schemas
const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  domain: z.string().optional(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens').optional(),
  businessName: z.string().min(1, 'Business name is required'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  selectedPackages: z.array(z.string()).optional(),
  pricingMarkup: z.record(z.any()).optional(), // Flexible pricing markup configuration
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

export default router;

