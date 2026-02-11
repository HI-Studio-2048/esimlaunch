import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export const affiliateService = {
  /**
   * Generate unique affiliate code
   */
  generateAffiliateCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  },

  /**
   * Get or create affiliate code for merchant
   */
  async getOrCreateAffiliateCode(merchantId: string): Promise<string> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { affiliateCode: true, referralCode: true },
    });

    if (merchant?.affiliateCode) {
      return merchant.affiliateCode;
    }

    // Generate new code
    let code: string;
    let exists = true;
    while (exists) {
      code = this.generateAffiliateCode();
      const existing = await prisma.merchant.findUnique({
        where: { affiliateCode: code },
      });
      exists = !!existing;
    }

    // Update merchant
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { affiliateCode: code! },
    });

    return code!;
  },

  /**
   * Get or create referral code for merchant
   */
  async getOrCreateReferralCode(merchantId: string): Promise<string> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { referralCode: true },
    });

    if (merchant?.referralCode) {
      return merchant.referralCode;
    }

    // Generate new code
    let code: string;
    let exists = true;
    while (exists) {
      code = this.generateAffiliateCode();
      const existing = await prisma.merchant.findUnique({
        where: { referralCode: code },
      });
      exists = !!existing;
    }

    // Update merchant
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { referralCode: code! },
    });

    return code!;
  },

  /**
   * Track referral (when a new merchant signs up with referral code)
   */
  async trackReferral(referredMerchantId: string, referralCode: string) {
    // Find affiliate by referral code
    const affiliate = await prisma.merchant.findUnique({
      where: { referralCode: referralCode },
      select: { id: true },
    });

    if (!affiliate) {
      throw new Error('Invalid referral code');
    }

    // Update referred merchant
    await prisma.merchant.update({
      where: { id: referredMerchantId },
      data: { referredBy: affiliate.id },
    });

    return affiliate.id;
  },

  /**
   * Create commission for affiliate
   */
  async createCommission(params: {
    affiliateId: string;
    referredMerchantId?: string;
    customerOrderId?: string;
    amount: number; // Amount in cents
    commissionRate: number; // Percentage (e.g., 10 for 10%)
    currency?: string;
  }) {
    const {
      affiliateId,
      referredMerchantId,
      customerOrderId,
      amount,
      commissionRate,
      currency = 'USD',
    } = params;

    // Calculate commission amount
    const commissionAmount = Math.round(amount * (commissionRate / 100));

    const commission = await prisma.affiliateCommission.create({
      data: {
        affiliateId,
        referredMerchantId: referredMerchantId || null,
        customerOrderId: customerOrderId || null,
        amount: BigInt(commissionAmount),
        currency,
        commissionRate,
        status: 'pending',
      },
    });

    return commission;
  },

  /**
   * Get affiliate stats
   */
  async getAffiliateStats(merchantId: string) {
    const [totalCommissions, pendingCommissions, paidCommissions, totalEarnings] = await Promise.all([
      prisma.affiliateCommission.count({ where: { affiliateId: merchantId } }),
      prisma.affiliateCommission.count({ where: { affiliateId: merchantId, status: 'pending' } }),
      prisma.affiliateCommission.count({ where: { affiliateId: merchantId, status: 'paid' } }),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId: merchantId, status: 'paid' },
        _sum: { amount: true },
      }),
    ]);

    const [referredMerchants, recentCommissions] = await Promise.all([
      prisma.merchant.count({ where: { referredBy: merchantId } }),
      prisma.affiliateCommission.findMany({
        where: { affiliateId: merchantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          customerOrder: {
            select: {
              id: true,
              customerEmail: true,
              totalAmount: true,
            },
          },
        },
      }),
    ]);

    return {
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      totalEarnings: Number(totalEarnings._sum.amount || 0) / 100,
      referredMerchants,
      recentCommissions: recentCommissions.map(c => ({
        ...c,
        amount: Number(c.amount) / 100,
      })),
    };
  },

  /**
   * Get commissions for affiliate
   */
  async getCommissions(merchantId: string, filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      affiliateId: merchantId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.affiliateCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customerOrder: {
          select: {
            id: true,
            customerEmail: true,
            totalAmount: true,
          },
        },
        referredMerchant: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },
};


