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
        role: string;
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
            role: true,
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
      role: matchedKey.merchant.role,
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

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'smtpPass', 'smtpPassword', 'token', 'sessionToken', 'secret', 'apiKey'];

function redactSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);
  const redacted: any = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      redacted[key] = redactSensitive(obj[key]);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
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
            requestBody: req.body && Object.keys(req.body).length > 0 ? redactSensitive(req.body) : undefined,
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
 * Caches rate limiter instances per API key so counters persist across requests.
 */
const rateLimiterCache = new Map<string, ReturnType<typeof rateLimit>>();
const MAX_CACHE_SIZE = 10000;

// Evict oldest entries when cache gets too large
function evictIfNeeded() {
  if (rateLimiterCache.size > MAX_CACHE_SIZE) {
    // Map iterates in insertion order — delete the oldest 20%
    const deleteCount = Math.floor(MAX_CACHE_SIZE * 0.2);
    let count = 0;
    for (const key of rateLimiterCache.keys()) {
      if (count >= deleteCount) break;
      rateLimiterCache.delete(key);
      count++;
    }
  }
}

export function createRateLimiter() {
  // Global fallback limiter for non-API-key requests (session users)
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, errorCode: 'RATE_LIMIT_EXCEEDED', errorMessage: 'Rate limit exceeded. Maximum 100 requests per minute.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      // Apply global limiter for session-based users too
      return globalLimiter(req, res, next);
    }

    const keyId = req.apiKey.id;
    let limiter = rateLimiterCache.get(keyId);

    if (!limiter) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        select: { rateLimit: true },
      });
      const requestsPerMinute = apiKey?.rateLimit || 100;

      limiter = rateLimit({
        windowMs: 60 * 1000,
        max: requestsPerMinute,
        message: {
          success: false,
          errorCode: 'RATE_LIMIT_EXCEEDED',
          errorMessage: `Rate limit exceeded. Maximum ${requestsPerMinute} requests per minute.`,
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => keyId,
      });
      rateLimiterCache.set(keyId, limiter);
      evictIfNeeded();
    }

    limiter(req, res, next);
  };
}

/**
 * Optional authentication - doesn't fail if no API key provided
 * Useful for public endpoints that can work with or without auth.
 * Does NOT delegate to authenticateApiKey (which sends 401 responses on failure
 * and would cause the request to hang instead of falling through).
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Try to authenticate silently — don't fail if it doesn't work
  try {
    const token = authHeader.substring(7);
    const isJWT = token.includes('.') && token.split('.').length === 3;

    if (isJWT) {
      const { authService } = await import('../services/authService');
      const decoded = await authService.verifyToken(token);
      const merchant = await prisma.merchant.findUnique({
        where: { id: decoded.merchantId },
        select: { id: true, email: true, serviceType: true, role: true, isActive: true },
      });
      if (merchant && merchant.isActive) {
        req.merchant = { id: merchant.id, email: merchant.email, serviceType: merchant.serviceType, role: merchant.role };
      }
    }
  } catch {
    // Silently ignore — optional auth
  }

  next();
}












