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
   * Track referral (when a new merchant signs up with referral code).
   * Throws on invalid code or self-referral so callers can surface the reason.
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

    if (affiliate.id === referredMerchantId) {
      throw new Error('Self-referral is not allowed');
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
    amount: number; // cents — for order/subscription, this is the gross; for bounty/weekly_goal, this is the reward itself
    type: 'order' | 'subscription' | 'bounty' | 'weekly_goal';
    commissionRate?: number; // override; otherwise derived from tier (order) or config (subscription) or 0 (bounty/goal)
    currency?: string;
    status?: 'pending' | 'paid' | 'cancelled';
    metadata?: Record<string, any>;
    stripeInvoiceId?: string;
  }) {
    const {
      affiliateId,
      referredMerchantId,
      customerOrderId,
      amount,
      type,
      currency = 'USD',
      metadata,
      stripeInvoiceId,
    } = params;

    let rate = params.commissionRate;
    let commissionAmount: number;

    if (type === 'order') {
      if (rate === undefined) {
        const { perOrderRateForTier } = await import('../config/affiliate');
        const merchant = await prisma.merchant.findUnique({
          where: { id: affiliateId },
          select: { affiliateTier: true },
        });
        rate = perOrderRateForTier((merchant?.affiliateTier as any) || 'bronze');
      }
      commissionAmount = Math.round(amount * (rate / 100));
    } else if (type === 'subscription') {
      if (rate === undefined) {
        const { SUBSCRIPTION_COMMISSION_RATE } = await import('../config/affiliate');
        rate = SUBSCRIPTION_COMMISSION_RATE;
      }
      commissionAmount = Math.round(amount * (rate / 100));
    } else {
      // bounty / weekly_goal — amount is the literal reward
      rate = rate ?? 0;
      commissionAmount = amount;
    }

    const status = params.status ?? (type === 'bounty' || type === 'weekly_goal' ? 'paid' : 'pending');

    return prisma.affiliateCommission.create({
      data: {
        affiliateId,
        referredMerchantId: referredMerchantId ?? null,
        customerOrderId: customerOrderId ?? null,
        amount: BigInt(commissionAmount),
        currency,
        commissionRate: rate,
        status,
        paidAt: status === 'paid' ? new Date() : null,
        type,
        metadata: metadata ?? undefined,
        stripeInvoiceId: stripeInvoiceId ?? null,
      },
    });
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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { countActiveReferrals } = await import('./affiliateTierService');
    const [referredMerchants, recentCommissions, clicksAllTime, clicks30d, activeReferredMerchants] = await Promise.all([
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
      prisma.affiliateClick.count({ where: { merchantId } }),
      prisma.affiliateClick.count({ where: { merchantId, createdAt: { gte: thirtyDaysAgo } } }),
      countActiveReferrals(merchantId),
    ]);

    const conversionRate = clicksAllTime > 0
      ? Number(((referredMerchants / clicksAllTime) * 100).toFixed(2))
      : 0;

    return {
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      totalEarnings: Number(totalEarnings._sum.amount || 0) / 100,
      referredMerchants,
      activeReferredMerchants,
      clicksAllTime,
      clicks30d,
      conversionRate,
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










