import express from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { seoService } from '../services/seoService';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Validation schemas
const seoConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().url().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional(),
  canonicalUrl: z.string().url().optional(),
  metaTags: z.record(z.string()).optional(),
});

/**
 * GET /api/seo/store/:storeId
 * Get store SEO configuration
 */
router.get('/store/:storeId', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const config = await seoService.getStoreSEO(storeId);

    if (!config) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch SEO configuration',
    });
  }
});

/**
 * PUT /api/seo/store/:storeId
 * Update store SEO configuration (requires authentication)
 */
router.put('/store/:storeId', authenticateJWT, async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const merchantId = (req as any).merchant!.id;
    const data = seoConfigSchema.parse(req.body);

    // Verify store belongs to merchant
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        merchantId,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        errorCode: 'STORE_NOT_FOUND',
        errorMessage: 'Store not found',
      });
    }

    await seoService.updateStoreSEO(storeId, data);

    res.json({
      success: true,
      message: 'SEO configuration updated successfully',
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
        errorMessage: error.message || 'Failed to update SEO configuration',
      });
    }
  }
});

/**
 * GET /api/seo/store/:storeId/sitemap
 * Generate sitemap for store
 */
router.get('/store/:storeId/sitemap', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const sitemap = await seoService.generateSitemap(storeId);

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'GENERATION_FAILED',
      errorMessage: error.message || 'Failed to generate sitemap',
    });
  }
});

/**
 * GET /api/seo/store/:storeId/robots
 * Generate robots.txt for store
 */
router.get('/store/:storeId/robots', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const robots = await seoService.generateRobotsTxt(storeId);

    res.setHeader('Content-Type', 'text/plain');
    res.send(robots);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'GENERATION_FAILED',
      errorMessage: error.message || 'Failed to generate robots.txt',
    });
  }
});

export default router;

