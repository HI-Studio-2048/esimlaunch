import express from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateJWT);

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().optional(),
  rateLimit: z.number().int().min(1).max(1000).optional(),
  expiresInDays: z.number().int().min(1).optional(),
});

/**
 * POST /api/api-keys
 * Generate a new API key
 */
router.post('/', async (req, res, next) => {
  try {
    const data = createApiKeySchema.parse(req.body);
    const apiKey = await authService.generateApiKey(
      req.merchant!.id,
      data.name,
      data.rateLimit,
      data.expiresInDays
    );
    res.json({
      success: true,
      data: apiKey,
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
        errorCode: 'API_KEY_GENERATION_FAILED',
        errorMessage: error.message || 'Failed to generate API key',
      });
    }
  }
});

/**
 * GET /api/api-keys
 * List all API keys for the merchant
 */
router.get('/', async (req, res, next) => {
  try {
    const apiKeys = await authService.listApiKeys(req.merchant!.id);
    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch API keys',
    });
  }
});

/**
 * DELETE /api/api-keys/:keyId
 * Revoke an API key
 */
router.delete('/:keyId', async (req, res, next) => {
  try {
    await authService.revokeApiKey(req.merchant!.id, req.params.keyId);
    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      errorCode: 'API_KEY_NOT_FOUND',
      errorMessage: error.message || 'API key not found',
    });
  }
});

export default router;




