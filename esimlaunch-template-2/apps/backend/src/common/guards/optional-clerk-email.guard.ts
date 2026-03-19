import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { verifyClerkToken } from './clerk-verify';

@Injectable()
export class OptionalClerkEmailGuard implements CanActivate {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const result = await verifyClerkToken(req.headers['authorization'], this.config, this.prisma);
      if (result) {
        req.userId = result.userId;
        req.userEmail = result.userEmail;
      }
    } catch {
      // Optional — silently ignore auth failures for guest flows
    }
    return true;
  }
}
