import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ensure an Affiliate row exists for a user. Called on user creation.
   */
  async ensureAffiliate(userId: string) {
    const existing = await this.prisma.affiliate.findUnique({ where: { userId } });
    if (existing) return existing;

    const referralCode = nanoid(8).toUpperCase();
    return this.prisma.affiliate.create({
      data: { userId, referralCode },
    });
  }

  async getAffiliateByUserId(userId: string) {
    return this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        referrals: true,
        commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  async getAffiliateByCode(code: string) {
    return this.prisma.affiliate.findUnique({ where: { referralCode: code } });
  }

  async makeCommissionsAvailable() {
    const now = new Date();
    await this.prisma.commission.updateMany({
      where: { status: 'pending', availableAt: { lte: now } },
      data: { status: 'available' },
    });
  }
}
