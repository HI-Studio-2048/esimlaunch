import { CanActivate, Injectable } from '@nestjs/common';

/**
 * CSRF protection is handled by SameSite cookies + CORS origin checking.
 * This guard is a no-op kept for backward compatibility with @UseGuards decorators.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
