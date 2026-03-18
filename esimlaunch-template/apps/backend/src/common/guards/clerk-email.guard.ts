import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { verifyClerkToken } from './clerk-verify';

@Injectable()
export class ClerkEmailGuard implements CanActivate {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const result = await verifyClerkToken(req.headers['authorization'], this.config, this.prisma);
      if (!result) throw new UnauthorizedException('Valid Authorization header required');
      req.userId = result.userId;
      req.userEmail = result.userEmail;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentication failed: ' + (error.message || 'Invalid token'));
    }
  }
}
