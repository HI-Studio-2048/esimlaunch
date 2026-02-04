import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header for dashboard/merchant endpoints
 */
export async function authenticateJWT(
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
    const decoded = await authService.verifyToken(token);

    // Get merchant info
    const merchant = await authService.getMerchantById(decoded.merchantId);

    if (!merchant.isActive) {
      res.status(403).json({
        success: false,
        errorCode: 'MERCHANT_INACTIVE',
        errorMessage: 'Merchant account is inactive',
      });
      return;
    }

    // Attach merchant to request
    req.merchant = {
      id: merchant.id,
      email: merchant.email,
      serviceType: merchant.serviceType,
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

