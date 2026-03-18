import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { customerAuthService } from '../services/customerAuthService';
import { customerOrderService } from '../services/customerOrderService';
import { authenticateCustomer } from '../middleware/customerAuth';

const router = express.Router();

const customerAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, errorCode: 'RATE_LIMIT', errorMessage: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * POST /api/customers/register
 * Register a new customer
 */
router.post('/register', customerAuthLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await customerAuthService.register(data);

    res.json({
      success: true,
      data: {
        customer: result.customer,
        token: result.token,
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
      res.status(400).json({
        success: false,
        errorCode: 'REGISTRATION_FAILED',
        errorMessage: error.message || 'Failed to register customer',
      });
    }
  }
});

/**
 * POST /api/customers/login
 * Customer login
 */
router.post('/login', customerAuthLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await customerAuthService.login(data);

    res.json({
      success: true,
      data: {
        customer: result.customer,
        token: result.token,
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
      res.status(401).json({
        success: false,
        errorCode: 'LOGIN_FAILED',
        errorMessage: error.message || 'Invalid email or password',
      });
    }
  }
});

/**
 * GET /api/customers/me
 * Get current customer (requires authentication)
 */
router.get('/me', authenticateCustomer, async (req, res, next) => {
  try {
    const customerId = (req as any).customer.id;
    const customer = await customerAuthService.getCustomerById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        errorCode: 'CUSTOMER_NOT_FOUND',
        errorMessage: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch customer',
    });
  }
});

/**
 * PUT /api/customers/me
 * Update customer profile (requires authentication)
 */
router.put('/me', authenticateCustomer, async (req, res, next) => {
  try {
    const customerId = (req as any).customer.id;
    const data = updateProfileSchema.parse(req.body);
    
    const customer = await customerAuthService.updateProfile(customerId, data);

    res.json({
      success: true,
      data: customer,
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
        errorMessage: error.message || 'Failed to update profile',
      });
    }
  }
});

/**
 * POST /api/customers/me/change-password
 * Change customer password (requires authentication)
 */
router.post('/me/change-password', authenticateCustomer, async (req, res, next) => {
  try {
    const customerId = (req as any).customer.id;
    const data = changePasswordSchema.parse(req.body);
    
    await customerAuthService.changePassword(
      customerId,
      data.oldPassword,
      data.newPassword
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error.errors[0].message,
      });
    } else {
      res.status(400).json({
        success: false,
        errorCode: 'PASSWORD_CHANGE_FAILED',
        errorMessage: error.message || 'Failed to change password',
      });
    }
  }
});

/**
 * GET /api/customers/me/orders
 * Get customer orders (requires authentication)
 */
router.get('/me/orders', authenticateCustomer, async (req, res, next) => {
  try {
    const customerId = (req as any).customer.id;
    const customer = await customerAuthService.getCustomerById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        errorCode: 'CUSTOMER_NOT_FOUND',
        errorMessage: 'Customer not found',
      });
    }

    // Get orders by customer email
    const orders = await customerOrderService.getByEmail(customer.email);

    res.json({
      success: true,
      data: orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount) / 100, // Convert from cents to dollars
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'FETCH_FAILED',
      errorMessage: error.message || 'Failed to fetch orders',
    });
  }
});

export default router;










