import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Validates x-csrf-token header on state-changing requests.
 * Token must be a 64-character hex string.
 * Webhook routes should bypass this guard.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Only check state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

    const token: string | undefined = req.headers['x-csrf-token'];
    if (!token || !/^[0-9a-f]{64}$/i.test(token)) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }
    return true;
  }
}
