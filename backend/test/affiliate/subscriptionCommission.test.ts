import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { handleSubscriptionInvoicePaid } from '../../src/services/subscriptionService';

describe('handleSubscriptionInvoicePaid', () => {
  let referrerId: string;
  let referredId: string;

  beforeEach(async () => {
    const ref = await prisma.merchant.create({ data: { email: `r-${Date.now()}@x.test`, password: 'x' } });
    referrerId = ref.id;
    const rd = await prisma.merchant.create({ data: { email: `rd-${Date.now()}@x.test`, password: 'x', referredBy: referrerId } });
    referredId = rd.id;
  });

  afterEach(async () => {
    await prisma.affiliateCommission.deleteMany({ where: { OR: [{ affiliateId: referrerId }, { referredMerchantId: referredId }] } });
    await prisma.merchant.deleteMany({ where: { id: { in: [referrerId, referredId] } } });
  });

  it('creates a pending 40% subscription commission', async () => {
    await handleSubscriptionInvoicePaid({
      merchantId: referredId,
      stripeInvoiceId: 'inv_test_1',
      amountPaidCents: 4900,
    });

    const commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: referrerId, type: 'subscription' },
    });
    expect(commissions).toHaveLength(1);
    expect(Number(commissions[0].amount)).toBe(1960); // 40% of 4900
    expect(commissions[0].status).toBe('pending');
    expect(commissions[0].commissionRate).toBe(40);
  });

  it('is idempotent on the same stripeInvoiceId', async () => {
    await handleSubscriptionInvoicePaid({ merchantId: referredId, stripeInvoiceId: 'inv_test_2', amountPaidCents: 4900 });
    await handleSubscriptionInvoicePaid({ merchantId: referredId, stripeInvoiceId: 'inv_test_2', amountPaidCents: 4900 });
    const commissions = await prisma.affiliateCommission.findMany({ where: { stripeInvoiceId: 'inv_test_2' } });
    expect(commissions).toHaveLength(1);
  });

  it('no-ops when referred merchant has no referrer', async () => {
    const standalone = await prisma.merchant.create({ data: { email: `s-${Date.now()}@x.test`, password: 'x' } });
    await handleSubscriptionInvoicePaid({ merchantId: standalone.id, stripeInvoiceId: 'inv_test_3', amountPaidCents: 4900 });
    const commissions = await prisma.affiliateCommission.findMany({ where: { stripeInvoiceId: 'inv_test_3' } });
    expect(commissions).toHaveLength(0);
    await prisma.merchant.delete({ where: { id: standalone.id } });
  });
});
