import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Optionally attaches req.userId and req.userEmail when x-user-email header is present.
 * Does NOT throw when header is missing (for guest flows).
 */
@Injectable()
export class OptionalClerkEmailGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawEmail: string | undefined = req.headers['x-user-email'];
    if (!rawEmail) return true;

    const email = rawEmail.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) user = await this.prisma.user.create({ data: { email } });

    req.userId = user.id;
    req.userEmail = email;
    return true;
  }
}
