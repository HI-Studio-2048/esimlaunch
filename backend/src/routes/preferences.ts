import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { preferencesService } from '../services/preferencesService';

const router = express.Router();

router.use(authenticateSessionOrJWT);

/**
 * GET /api/merchant/preferences
 * Get all preferences (onboarding, last store, currency) from DB - no localStorage.
 */
router.get('/', async (req, res) => {
  try {
    if (!req.merchant) {
      return res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Authentication required',
      });
    }
    const prefs = await preferencesService.getAll(req.merchant.id);
    res.json({ success: true, data: prefs });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'PREFERENCES_FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch preferences',
    });
  }
});

const patchSchema = z.object({
  onboarding_progress: z.record(z.boolean()).optional(),
  step_completion_dates: z.record(z.string()).optional(),
  last_selected_store_id: z.string().uuid().nullable().optional(),
  preferred_currency: z.string().min(1).optional(),
});

/**
 * PATCH /api/merchant/preferences
 * Update preferences in DB.
 */
router.patch('/', async (req, res) => {
  try {
    if (!req.merchant) {
      return res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Authentication required',
      });
    }
    const data = patchSchema.parse(req.body);
    const merchantId = req.merchant.id;

    if (data.onboarding_progress) {
      await preferencesService.setOnboardingProgress(merchantId, data.onboarding_progress);
    }
    if (data.step_completion_dates) {
      for (const [step, date] of Object.entries(data.step_completion_dates)) {
        await preferencesService.setStepCompletionDate(merchantId, step, date);
      }
    }
    if (data.last_selected_store_id !== undefined) {
      await preferencesService.setLastSelectedStoreId(merchantId, data.last_selected_store_id);
    }
    if (data.preferred_currency) {
      await preferencesService.setPreferredCurrency(merchantId, data.preferred_currency);
    }

    const prefs = await preferencesService.getAll(merchantId);
    res.json({ success: true, data: prefs });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      errorCode: 'PREFERENCES_UPDATE_FAILED',
      errorMessage: error.message || 'Failed to update preferences',
    });
  }
});

export default router;
