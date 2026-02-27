import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { customerAuthService } from '../services/customerAuthService';

/**
 * Customer JWT Authentication Middleware
 * Validates JWT token from Authorization header for customer endpoints
 */
export async function authenticateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Missing or invalid Authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, env.jwtSecret) as { customerId: string; email: string };

    // Get customer info
    const customer = await customerAuthService.getCustomerById(decoded.customerId);

    if (!customer) {
      res.status(401).json({
        success: false,
        errorCode: 'CUSTOMER_NOT_FOUND',
        errorMessage: 'Customer not found',
      });
      return;
    }

    // Attach customer to request
    (req as any).customer = {
      id: customer.id,
      email: customer.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      errorMessage: error.message || 'Invalid or expired token',
    });
  }
}










