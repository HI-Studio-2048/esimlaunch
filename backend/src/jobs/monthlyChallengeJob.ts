import { prisma } from '../lib/prisma';
import { MONTHLY_CHALLENGE } from '../config/affiliate';

/**
 * Evaluates last completed calendar month. Idempotent per (affiliateId, month).
 * Run daily; it only acts on the 1st of a month at 00:05 UTC (or if a prior run
 * was missed and the prior month still has no payout row).
 */
export async function runMonthlyChallengeJob(now: Date = new Date()): Promise<void> {
  const prevMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthKey = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const start = new Date(Date.UTC(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // For every merchant, count active referrals created in the month window
  const referralsInMonth = await prisma.affiliateCommission.groupBy({
    by: ['affiliateId'],
    where: {
      type: 'subscription',
      status: { not: 'cancelled' },
      createdAt: { gte: start, lt: end },
    },
    _count: { referredMerchantId: true },
  });

  for (const row of referralsInMonth) {
    // Count distinct referred merchants for this affiliate in the window
    const distinctReferred = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: row.affiliateId,
        type: 'subscription',
        status: { not: 'cancelled' },
        createdAt: { gte: start, lt: end },
      },
      distinct: ['referredMerchantId'],
      select: { referredMerchantId: true },
    });
    if (distinctReferred.length < MONTHLY_CHALLENGE.target) continue;

    const alreadyPaid = await prisma.affiliateCommission.findFirst({
      where: {
        affiliateId: row.affiliateId,
        type: 'bounty',
        metadata: { path: ['monthlyChallengeMonth'], equals: monthKey },
      },
    });
    if (alreadyPaid) continue;

    await prisma.affiliateCommission.create({
      data: {
        affiliateId: row.affiliateId,
        amount: BigInt(MONTHLY_CHALLENGE.amountCents),
        currency: 'USD',
        commissionRate: 0,
        status: 'paid',
        paidAt: new Date(),
        type: 'bounty',
        metadata: { monthlyChallengeMonth: monthKey, target: MONTHLY_CHALLENGE.target },
      },
    });
  }
}
