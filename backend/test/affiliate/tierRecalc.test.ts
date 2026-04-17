import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { recalculateTier, countActiveReferrals } from '../../src/services/affiliateTierService';

describe('affiliateTierService.recalculateTier', () => {
  let referrerId: string;

  beforeEach(async () => {
    const m = await prisma.merchant.create({
      data: { email: `ref-${Date.now()}@x.test`, password: 'x', affiliateTier: 'bronze' },
    });
    referrerId = m.id;
  });

  afterEach(async () => {
    await prisma.merchant.deleteMany({ where: { id: referrerId } });
  });

  it('keeps bronze with 0 active referrals', async () => {
    expect(await countActiveReferrals(referrerId)).toBe(0);
    expect(await recalculateTier(referrerId)).toBe('bronze');
  });

  it('promotes to silver at 5 active referrals', async () => {
    for (let i = 0; i < 5; i++) {
      const refd = await prisma.merchant.create({
        data: { email: `refd-${i}-${Date.now()}@x.test`, password: 'x', referredBy: referrerId },
      });
      await prisma.affiliateCommission.create({
        data: {
          affiliateId: referrerId,
          referredMerchantId: refd.id,
          amount: BigInt(1000),
          commissionRate: 40,
          type: 'subscription',
          status: 'paid',
        },
      });
    }
    expect(await countActiveReferrals(referrerId)).toBe(5);
    expect(await recalculateTier(referrerId)).toBe('silver');
  });
});
