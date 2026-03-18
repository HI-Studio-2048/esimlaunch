import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface BucketEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory per-endpoint rate limiter.
 * Works alongside the global express-rate-limit middleware (60/min per IP).
 * This guard provides tighter limits on sensitive endpoints like order creation.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private buckets = new Map<string, BucketEntry>();

  constructor(private reflector: Reflector) {
    // Clean up expired buckets every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.buckets) {
        if (entry.resetAt < now) this.buckets.delete(key);
      }
    }, 2 * 60_000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const opts = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!opts) return true; // No rate limit metadata → allow

    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const route = `${req.method}:${req.route?.path || req.url}`;
    const key = `${ip}:${route}`;
    const now = Date.now();

    const entry = this.buckets.get(key);
    if (!entry || entry.resetAt < now) {
      this.buckets.set(key, { count: 1, resetAt: now + opts.window * 1000 });
      return true;
    }

    entry.count++;
    if (entry.count > opts.limit) {
      throw new HttpException(
        { success: false, message: 'Too many requests. Please slow down.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
