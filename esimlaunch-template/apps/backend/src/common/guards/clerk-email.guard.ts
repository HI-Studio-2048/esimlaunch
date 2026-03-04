import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Requires the x-user-email header. Looks up (or creates) the User in DB.
 * Attaches req.userId and req.userEmail.
 *
 * This follows the Voyage auth pattern: the backend does NOT validate Clerk
 * JWTs. It trusts the email passed from the authenticated frontend.
 */
@Injectable()
export class ClerkEmailGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawEmail: string | undefined = req.headers['x-user-email'];
    if (!rawEmail) {
      throw new UnauthorizedException('x-user-email header is required');
    }

    const email = rawEmail.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email } });
    }

    req.userId = user.id;
    req.userEmail = email;
    return true;
  }
}
