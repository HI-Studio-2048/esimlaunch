import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClerkEmailGuard } from '../../common/guards/clerk-email.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { CurrentUserId, CurrentUserEmail } from '../../common/decorators/user.decorator';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Controller('user')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * GET /api/user/orders
   * Returns orders for the authenticated user (for order history).
   */
  @Get('orders')
  @UseGuards(ClerkEmailGuard)
  async getMyOrders(@CurrentUserId() userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { esimProfile: { select: { id: true } } },
    });
    return orders.map((o) => ({
      id: o.id,
      planId: o.planId,
      planName: o.planName,
      amountCents: o.amountCents,
      displayCurrency: o.displayCurrency,
      displayAmountCents: o.displayAmountCents,
      status: o.status,
      createdAt: o.createdAt,
      hasEsim: !!o.esimProfile,
    }));
  }

  /**
   * GET /api/user/esims
   * Returns all eSIM profiles belonging to the authenticated user.
   */
  @Get('esims')
  @UseGuards(ClerkEmailGuard)
  async getMyEsims(@CurrentUserId() userId: string) {
    const profiles = await this.prisma.esimProfile.findMany({
      where: { userId },
      include: {
        order: { select: { id: true, planId: true, planName: true, amountCents: true, displayCurrency: true } },
        usageHistory: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return profiles.map((p) => ({
      ...p,
      totalVolume: p.totalVolume?.toString() ?? null,
      orderUsage: p.orderUsage?.toString() ?? null,
    }));
  }

  /**
   * POST /api/user/delete-account
   * Deletes user in Clerk and removes all associated data in a single DB transaction.
   */
  @Post('delete-account')
  @UseGuards(ClerkEmailGuard, CsrfGuard)
  async deleteAccount(
    @CurrentUserId() userId: string,
    @Body() body: { clerkUserId: string },
  ) {
    if (!body.clerkUserId) throw new BadRequestException('clerkUserId is required');

    // Delete in Clerk first
    const clerkSecret = this.config.get<string>('CLERK_SECRET_KEY');
    if (clerkSecret) {
      try {
        const clerk = createClerkClient({ secretKey: clerkSecret });
        await clerk.users.deleteUser(body.clerkUserId);
      } catch (e: any) {
        // Log but continue with DB deletion
        console.warn('Clerk delete failed:', e.message);
      }
    }

    // Delete all user data in dependency order (single transaction)
    await this.prisma.$transaction(async (tx) => {
      // Usage history → esim profiles
      const profiles = await tx.esimProfile.findMany({ where: { userId } });
      for (const p of profiles) {
        await tx.esimUsageHistory.deleteMany({ where: { profileId: p.id } });
        await tx.topUp.deleteMany({ where: { profileId: p.id } });
      }
      await tx.esimProfile.deleteMany({ where: { userId } });

      // Orders and commissions
      const orders = await tx.order.findMany({ where: { userId } });
      for (const o of orders) {
        await tx.commission.deleteMany({ where: { orderId: o.id } });
      }
      await tx.order.deleteMany({ where: { userId } });

      // Affiliate + referrals + commissions
      const affiliate = await tx.affiliate.findUnique({ where: { userId } });
      if (affiliate) {
        await tx.commission.deleteMany({ where: { affiliateId: affiliate.id } });
        await tx.referral.deleteMany({ where: { affiliateId: affiliate.id } });
        await tx.affiliate.delete({ where: { id: affiliate.id } });
      }

      // Referral where user is the referred
      await tx.referral.deleteMany({ where: { referredUserId: userId } });

      // VCash
      await tx.vCashTransaction.deleteMany({ where: { userId } });
      await tx.vCashBalance.deleteMany({ where: { userId } });

      // Support tickets (anonymize)
      await tx.supportTicket.updateMany({
        where: { userId },
        data: { userId: null, email: 'deleted@account' },
      });

      // Finally delete user
      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true, message: 'Account deleted' };
  }
}
