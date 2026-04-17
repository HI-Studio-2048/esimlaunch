import { prisma } from '../lib/prisma';
import {
  tierForActiveReferrals,
  MILESTONE_BOUNTIES,
  WEEKLY_GOALS,
  isoWeekUTC,
  type AffiliateTierKey,
} from '../config/affiliate';
import { affiliateService } from './affiliateService';

/**
 * An "active referral" is a referred merchant who has at least one
 * non-cancelled subscription commission on file. We use the commission
 * table as proof-of-subscription to avoid coupling to Stripe state.
 */
export async function countActiveReferrals(referrerId: string): Promise<number> {
  const rows = await prisma.affiliateCommission.findMany({
    where: {
      affiliateId: referrerId,
      type: 'subscription',
      status: { not: 'cancelled' },
      referredMerchantId: { not: null },
    },
    select: { referredMerchantId: true },
    distinct: ['referredMerchantId'],
  });
  return rows.length;
}

export async function recalculateTier(referrerId: string): Promise<AffiliateTierKey> {
  const count = await countActiveReferrals(referrerId);
  const newTier = tierForActiveReferrals(count);
  await prisma.merchant.update({
    where: { id: referrerId },
    data: { affiliateTier: newTier },
  });
  return newTier;
}

async function evaluateMilestoneBounties(referrerId: string, activeCount: number) {
  for (const m of MILESTONE_BOUNTIES) {
    if (m.threshold > activeCount) continue;
    // Optimistic fast-path: skip if already claimed
    const existing = await prisma.affiliateBountyClaim.findUnique({
      where: { merchantId_bountyKey: { merchantId: referrerId, bountyKey: m.key } },
    });
    if (existing) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const commission = await tx.affiliateCommission.create({
          data: {
            affiliateId: referrerId,
            amount: BigInt(m.amountCents),
            currency: 'USD',
            commissionRate: 0,
            status: 'paid',
            paidAt: new Date(),
            type: 'bounty',
            metadata: { bountyKey: m.key, threshold: m.threshold },
          },
        });
        await tx.affiliateBountyClaim.create({
          data: {
            merchantId: referrerId,
            bountyKey: m.key,
            commissionId: commission.id,
          },
        });
      });
    } catch (err) {
      const { Prisma } = await import('@prisma/client');
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Another concurrent call won the race — cancel the orphan commission if any
        // and treat this milestone as already-claimed; continue to next milestone.
        await prisma.affiliateCommission.updateMany({
          where: {
            affiliateId: referrerId,
            type: 'bounty',
            status: 'paid',
            metadata: { path: ['bountyKey'], equals: m.key },
          },
          data: { status: 'cancelled' },
        }).catch(() => {/* best-effort cleanup */});
        continue;
      }
      throw err;
    }
  }
}

async function incrementWeeklyProgress(referrerId: string) {
  const isoWeek = isoWeekUTC();

  const row = await prisma.affiliateWeeklyProgress.upsert({
    where: { merchantId_isoWeek: { merchantId: referrerId, isoWeek } },
    create: { merchantId: referrerId, isoWeek, referralCount: 1 },
    update: { referralCount: { increment: 1 } },
  });

  for (const tier of WEEKLY_GOALS) {
    const paidField = `${tier.key}Paid` as 'bronzePaid' | 'silverPaid' | 'goldPaid';
    if (row[paidField] || row.referralCount < tier.target) continue;

    await prisma.$transaction(async (tx) => {
      const commission = await tx.affiliateCommission.create({
        data: {
          affiliateId: referrerId,
          amount: BigInt(tier.amountCents),
          currency: 'USD',
          commissionRate: 0,
          status: 'paid',
          paidAt: new Date(),
          type: 'weekly_goal',
          metadata: { isoWeek, goalKey: tier.key, target: tier.target },
        },
      });
      // Compare-and-set: only flip paidField=true if it is still false.
      // count===0 means another concurrent call already flipped it.
      const { count } = await tx.affiliateWeeklyProgress.updateMany({
        where: { merchantId: referrerId, isoWeek, [paidField]: false },
        data: { [paidField]: true },
      });
      if (count === 0) {
        // Race lost — cancel the orphan commission we just created.
        await tx.affiliateCommission.update({
          where: { id: commission.id },
          data: { status: 'cancelled' },
        });
      }
    });
  }
}

/**
 * Called when a referred merchant's first subscription invoice is paid.
 * Recomputes tier, pays out milestone bounties, updates weekly progress.
 */
export async function handleActiveReferral(referrerId: string) {
  const activeCount = await countActiveReferrals(referrerId);
  await recalculateTier(referrerId);
  await evaluateMilestoneBounties(referrerId, activeCount);
  await incrementWeeklyProgress(referrerId);
}
