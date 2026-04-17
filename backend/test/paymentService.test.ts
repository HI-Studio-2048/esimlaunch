import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testPrisma } from './setup';
import { createMerchant, createStore, createCustomerOrder } from './helpers';

/**
 * paymentService tests focus on the two business-critical webhook branches:
 *   1. TOPUP crediting (and its idempotency against Stripe retries)
 *   2. Easy-Way refund reversing the merchant balance
 *
 * Stripe is mocked (we never talk to the real API). Prisma is real and writes
 * to the isolated TEST_DATABASE_URL set up in test/setup.ts.
 */

// Mock Stripe BEFORE importing the service — otherwise the service's
// `new Stripe(...)` runs against the real SDK constructor.
vi.mock('stripe', () => {
  // Minimal Stripe shape we need in the tests. handleRefund calls
  // stripe.paymentIntents.retrieve() to find a paymentIntent by id.
  class FakeStripe {
    paymentIntents = {
      retrieve: vi.fn(async (id: string) => ({ id, status: 'succeeded', amount: 0 })),
    };
    refunds = { create: vi.fn() };
    static webhooks = { constructEvent: vi.fn() };
  }
  return { default: FakeStripe };
});

// paymentService lazy-imports customerOrderService when metadata includes storeId.
// Mock it to a no-op so our tests don't accidentally trigger upstream calls.
vi.mock('../src/services/customerOrderService', () => ({
  customerOrderService: { createCustomerOrder: vi.fn() },
}));

import { paymentService } from '../src/services/paymentService';

function fakePaymentIntent(overrides: any = {}) {
  return {
    id: overrides.id ?? 'pi_test_123',
    status: overrides.status ?? 'succeeded',
    amount: overrides.amount ?? 5000,
    currency: overrides.currency ?? 'usd',
    metadata: overrides.metadata ?? {},
  } as any;
}

describe('paymentService.handlePaymentSucceeded — TOPUP flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('credits the merchant balance and records a TOPUP transaction', async () => {
    const merchant = await createMerchant({ balanceCents: 0n });

    await paymentService.handlePaymentSucceeded(
      fakePaymentIntent({
        id: 'pi_topup_1',
        amount: 5000,
        metadata: { type: 'TOPUP', merchantId: merchant.id },
      })
    );

    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(5000n);

    const txs = await testPrisma.balanceTransaction.findMany({
      where: { merchantId: merchant.id },
    });
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe('TOPUP');
    expect(txs[0].amount).toBe(5000n);
    expect(txs[0].description).toContain('pi_topup_1');
  });

  it('is idempotent against Stripe webhook retries (same payment intent id)', async () => {
    const merchant = await createMerchant({ balanceCents: 0n });
    const intent = fakePaymentIntent({
      id: 'pi_topup_dedup',
      amount: 7500,
      metadata: { type: 'TOPUP', merchantId: merchant.id },
    });

    // Stripe delivers the same event twice.
    await paymentService.handlePaymentSucceeded(intent);
    await paymentService.handlePaymentSucceeded(intent);

    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(7500n);

    const txs = await testPrisma.balanceTransaction.findMany({
      where: { merchantId: merchant.id },
    });
    expect(txs).toHaveLength(1);
  });

  it('does not touch balance when metadata.type is not TOPUP', async () => {
    const merchant = await createMerchant({ balanceCents: 1000n });
    await paymentService.handlePaymentSucceeded(
      fakePaymentIntent({
        id: 'pi_not_topup',
        amount: 9999,
        metadata: { merchantId: merchant.id }, // no `type`
      })
    );
    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(1000n);
    const txs = await testPrisma.balanceTransaction.findMany({ where: { merchantId: merchant.id } });
    expect(txs).toHaveLength(0);
  });
});

describe('paymentService.handleRefund — Easy-Way customer order', () => {
  it('credits merchant balance, marks order CANCELLED, logs a REFUND transaction', async () => {
    const merchant = await createMerchant({ balanceCents: 0n });
    const store = await createStore(merchant.id);
    const order = await createCustomerOrder(merchant.id, store.id, {
      totalAmountCents: 2500n,
      paymentIntentId: 'pi_refund_1',
    });

    await paymentService.handleRefund({
      id: 'ch_1',
      payment_intent: 'pi_refund_1',
    } as any);

    const afterMerchant = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(afterMerchant?.balance).toBe(2500n);

    const afterOrder = await testPrisma.customerOrder.findUnique({ where: { id: order.id } });
    expect(afterOrder?.status).toBe('CANCELLED');

    const txs = await testPrisma.balanceTransaction.findMany({ where: { merchantId: merchant.id } });
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe('REFUND');
    expect(txs[0].amount).toBe(2500n);
  });

  it('is a no-op when no customer order matches the payment intent', async () => {
    const merchant = await createMerchant({ balanceCents: 1000n });
    await paymentService.handleRefund({
      id: 'ch_2',
      payment_intent: 'pi_nonexistent',
    } as any);
    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(1000n);
  });
});
