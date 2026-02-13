import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Store Router Middleware
 * Detects incoming domain/subdomain and attaches store to request
 * This allows stores to be accessed via custom domains or subdomains
 */
export async function storeRouter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const host = req.get('host') || '';
    const hostname = host.split(':')[0]; // Remove port if present

    // Skip if it's the main domain (e.g., esimlaunch.com)
    // You should configure this based on your main domain
    const mainDomains = [
      'localhost',
      'esimlaunch.com',
      'www.esimlaunch.com',
      process.env.MAIN_DOMAIN || 'localhost',
    ];

    if (mainDomains.includes(hostname)) {
      return next();
    }

    // Check if it's a subdomain (e.g., merchant1.esimlaunch.com)
    const subdomainMatch = hostname.match(/^([^.]+)\.(.+)$/);
    if (subdomainMatch) {
      const [, subdomain, baseDomain] = subdomainMatch;
      
      // Check if base domain is our domain
      if (baseDomain.includes('esimlaunch.com') || process.env.ALLOWED_BASE_DOMAIN?.includes(baseDomain)) {
        const store = await prisma.store.findUnique({
          where: { subdomain },
          include: {
            merchant: {
              select: {
                id: true,
                email: true,
                serviceType: true,
              },
            },
          },
        });

        if (store && store.isActive) {
          // Attach store to request
          (req as any).store = store;
          (req as any).storeContext = {
            type: 'subdomain',
            subdomain,
          };
          return next();
        }
      }
    }

    // Check if it's a custom domain
    const store = await prisma.store.findFirst({
      where: {
        domain: hostname,
        isActive: true,
        domainVerified: true, // Only allow verified domains
      },
      include: {
        merchant: {
          select: {
            id: true,
            email: true,
            serviceType: true,
          },
        },
      },
    });

    if (store) {
      // Attach store to request
      (req as any).store = store;
      (req as any).storeContext = {
        type: 'custom_domain',
        domain: hostname,
      };
      return next();
    }

    // No store found, continue with normal routing
    // (could be a 404 page or redirect to main site)
    next();
  } catch (error: any) {
    console.error('Store router error:', error);
    // Continue with normal routing on error
    next();
  }
}

/**
 * Middleware to require store context
 * Use this on routes that require a store to be loaded
 */
export function requireStore(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(req as any).store) {
    res.status(404).json({
      success: false,
      errorCode: 'STORE_NOT_FOUND',
      errorMessage: 'Store not found or not accessible',
    });
    return;
  }
  next();
}




