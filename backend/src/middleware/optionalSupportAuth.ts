import { Request, Response, NextFunction } from 'express';
import { authenticateSessionCookie } from './sessionAuth';
import { authService } from '../services/authService';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { customerAuthService } from '../services/customerAuthService';

/**
 * Optional auth for support ticket routes.
 * Tries (in order): session cookie, merchant JWT, customer JWT.
 * Populates req.merchant or req.customer when valid. Never fails - always calls next().
 */
export async function optionalSupportAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const proceed = () => next();

  await authenticateSessionCookie(req, res, async () => {
    if ((req as any).merchant || (req as any).customer) {
      return proceed();
    }
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await authService.verifyToken(token);
        const merchant = await authService.getMerchantById(decoded.merchantId);
        if (merchant?.isActive) {
          (req as any).merchant = {
            id: merchant.id,
            email: merchant.email,
            name: merchant.name,
            serviceType: merchant.serviceType,
            role: (merchant as any).role ?? 'MERCHANT',
          };
          return proceed();
        }
      } catch (_) {
        // Not merchant JWT
      }
      try {
        const decoded = jwt.verify(token, env.jwtSecret) as { customerId: string; email: string };
        const customer = await customerAuthService.getCustomerById(decoded.customerId);
        if (customer) {
          (req as any).customer = {
            id: customer.id,
            email: customer.email,
          };
        }
      } catch (_) {
        // Not customer JWT
      }
    }
    proceed();
  });
}
