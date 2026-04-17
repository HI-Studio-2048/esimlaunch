import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { handleSubscriptionInvoicePaid, handleSubscriptionInvoiceRefunded } from '../../src/services/subscriptionService';

describe('handleSubscriptionInvoiceRefunded', () => {
  let referrerId: string;
  let referredId: string;

  beforeEach(async () => {
    const ref = await prisma.merchant.create({ data: { email: `r-${Date.now()}@x.test`, password: 'x' } });
    referrerId = ref.id;
    const rd = await prisma.merchant.create({ data: { email: `rd-${Date.now()}@x.test`, password: 'x', referredBy: referrerId } });
    referredId = rd.id;
    await handleSubscriptionInvoicePaid({ merchantId: referredId, stripeInvoiceId: 'inv_cb_1', amountPaidCents: 4900 });
  });

  afterEach(async () => {
    await prisma.affiliateCommission.deleteMany({ where: { OR: [{ affiliateId: referrerId }, { referredMerchantId: referredId }] } });
    await prisma.affiliateBountyClaim.deleteMany({ where: { merchantId: referrerId } });
    await prisma.affiliateWeeklyProgress.deleteMany({ where: { merchantId: referrerId } });
    await prisma.merchant.deleteMany({ where: { id: { in: [referrerId, referredId] } } });
  });

  it('cancels the subscription commission', async () => {
    await handleSubscriptionInvoiceRefunded({ stripeInvoiceId: 'inv_cb_1' });
    const c = await prisma.affiliateCommission.findFirst({ where: { stripeInvoiceId: 'inv_cb_1' } });
    expect(c?.status).toBe('cancelled');
  });

  it('demotes tier when all subscription commissions for the referred merchant are cancelled', async () => {
    await handleSubscriptionInvoiceRefunded({ stripeInvoiceId: 'inv_cb_1' });
    const referrer = await prisma.merchant.findUnique({ where: { id: referrerId } });
    expect(referrer?.affiliateTier).toBe('bronze');
  });
});
