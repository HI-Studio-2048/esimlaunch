import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkEmailGuard } from '../../common/guards/clerk-email.guard';
import { CurrentUserId } from '../../common/decorators/user.decorator';
import { PrismaService } from '../../prisma.service';

@Controller('vcash')
export class VCashController {
  constructor(private prisma: PrismaService) {}

  /**
   * GET /api/vcash/balance
   * Returns current user's V-Cash balance.
   */
  @Get('balance')
  @UseGuards(ClerkEmailGuard)
  async getBalance(@CurrentUserId() userId: string) {
    const balance = await this.prisma.vCashBalance.findUnique({ where: { userId } });
    return { balanceCents: balance?.balanceCents ?? 0 };
  }
}
