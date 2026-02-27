import express from 'express';
import { z } from 'zod';
import { authenticateSessionOrJWT } from '../middleware/jwtAuth';
import { emailTemplateService } from '../services/emailTemplateService';

const router = express.Router();

// All routes require JWT authentication
router.use(authenticateSessionOrJWT);

// Validation schemas
const updateTemplateSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
});

const previewSchema = z.object({
  sampleVariables: z.record(z.string()),
});

/**
 * GET /api/email-templates
 * Get all email templates
 */
router.get('/', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const templates = await emailTemplateService.getTemplates(merchantId);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch email templates',
    });
  }
});

/**
 * GET /api/email-templates/:templateId
 * Get template by ID
 */
router.get('/:templateId', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { templateId } = req.params;
    const template = await emailTemplateService.getTemplate(merchantId, templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        errorCode: 'TEMPLATE_NOT_FOUND',
        errorMessage: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch template',
    });
  }
});

/**
 * PUT /api/email-templates/:templateId
 * Update template
 */
router.put('/:templateId', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { templateId } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    await emailTemplateService.updateTemplate(merchantId, templateId, data);

    res.json({
      success: true,
      message: 'Template updated successfully',
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
        errorMessage: error.message || 'Failed to update template',
      });
    }
  }
});

/**
 * POST /api/email-templates/:templateId/preview
 * Preview template with sample data
 */
router.post('/:templateId/preview', async (req, res, next) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { templateId } = req.params;
    const data = previewSchema.parse(req.body);

    const preview = await emailTemplateService.previewTemplate(
      merchantId,
      templateId,
      data.sampleVariables
    );

    res.json({
      success: true,
      data: preview,
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
        errorCode: 'PREVIEW_FAILED',
        errorMessage: error.message || 'Failed to preview template',
      });
    }
  }
});

export default router;










