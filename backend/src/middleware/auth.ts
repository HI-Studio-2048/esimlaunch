import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

// Extend Express Request to include merchant info
declare global {
  namespace Express {
    interface Request {
      merchant?: {
        id: string;
        email: string;
        serviceType: string;
      };
      apiKey?: {
        id: string;
        keyPrefix: string;
      };
    }
  }
}

/**
 * For /api/v1: try session cookie (Prisma DB) first, then Bearer (JWT or API key).
 * So logged-in users can call eSIM Access API without storing an API key in localStorage.
 */
export async function authenticateSessionOrApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { authenticateSessionCookie } = await import('./sessionAuth');
  await authenticateSessionCookie(req, res, async () => {
    if (req.merchant) return next();
    return authenticateApiKey(req, res, next);
  });
}

/**
 * API Key Authentication Middleware
 * Validates Bearer token - accepts either API key or JWT token
 * For dashboard/internal use: JWT tokens are preferred (works across devices)
 * For external API use: API keys are required
 */
export async function authenticateApiKey(
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
        errorMessage: 'Missing or invalid Authorization header. Use: Bearer YOUR_API_KEY or JWT_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Determine if token is JWT or API key
    // JWT tokens have 3 parts separated by dots (header.payload.signature)
    // API keys start with "sk_live_"
    const isJWT = token.includes('.') && token.split('.').length === 3;
    const isAPIKey = token.startsWith('sk_live_');

    // Try JWT authentication first (for dashboard/internal use)
    if (isJWT) {
      const { authenticateJWT } = await import('./jwtAuth');
      // authenticateJWT will handle the response if it fails
      return authenticateJWT(req, res, next);
    }

    // If not JWT, try API key authentication
    if (!isAPIKey) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Invalid token format. Use JWT token or API key (starting with sk_live_)',
      });
      return;
    }

    const apiKey = token;

    if (!apiKey || apiKey.length < 20) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Invalid API key format',
      });
      return;
    }

    // Find API key in database using prefix to narrow candidates first,
    // then bcrypt-compare only the matching prefix rows (avoids O(n) full-table scan).
    const keyPrefix = apiKey.substring(0, 12);
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        isActive: true,
        keyPrefix,
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            serviceType: true,
            isActive: true,
          },
        },
      },
    });

    let matchedKey = null;
    for (const keyRecord of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, keyRecord.key);
      if (isValid) {
        matchedKey = keyRecord;
        break;
      }
    }

    if (!matchedKey) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Invalid API key',
      });
      return;
    }

    // Check if merchant is active
    if (!matchedKey.merchant.isActive) {
      res.status(403).json({
        success: false,
        errorCode: 'MERCHANT_INACTIVE',
        errorMessage: 'Merchant account is inactive',
      });
      return;
    }

    // Check if API key is expired
    if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        errorCode: 'API_KEY_EXPIRED',
        errorMessage: 'API key has expired',
      });
      return;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: matchedKey.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach merchant and API key info to request
    req.merchant = {
      id: matchedKey.merchant.id,
      email: matchedKey.merchant.email,
      serviceType: matchedKey.merchant.serviceType,
    };
    req.apiKey = {
      id: matchedKey.id,
      keyPrefix: matchedKey.keyPrefix,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      errorCode: 'AUTH_ERROR',
      errorMessage: 'Authentication failed',
    });
  }
}

/**
 * Request Logging Middleware
 * Logs all API requests for audit trail
 */
export async function logApiRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log the request asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await prisma.apiLog.create({
          data: {
            merchantId: req.merchant?.id,
            apiKeyId: req.apiKey?.id,
            endpoint: req.path,
            method: req.method,
            statusCode,
            responseTime,
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            userAgent: req.get('user-agent') || undefined,
            requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
            responseBody: statusCode >= 400 && body ? JSON.parse(body) : undefined,
            errorMessage: statusCode >= 400 ? body : undefined,
          },
        });
      } catch (error) {
        console.error('Failed to log API request:', error);
      }
    });

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Rate Limiting Middleware Factory
 * Creates rate limiter based on merchant's API key rate limit
 */
export function createRateLimiter() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return next();
    }

    // Get API key rate limit from database
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: req.apiKey.id },
      select: { rateLimit: true },
    });

    const requestsPerMinute = apiKey?.rateLimit || 100;

    // Create rate limiter for this specific request
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: requestsPerMinute,
      message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        errorMessage: `Rate limit exceeded. Maximum ${requestsPerMinute} requests per minute.`,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.apiKey?.id ?? req.ip ?? 'unknown';
      },
    });

    limiter(req, res, next);
  };
}

/**
 * Optional authentication - doesn't fail if no API key provided
 * Useful for public endpoints that can work with or without auth
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  // Try to authenticate, but don't fail if it doesn't work
  try {
    await authenticateApiKey(req, res, () => {
      next(); // Continue if auth succeeds
    });
  } catch (error) {
    next(); // Continue even if auth fails
  }
}












