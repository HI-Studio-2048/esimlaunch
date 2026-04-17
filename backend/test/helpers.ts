import { testPrisma } from './setup';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Shared test builders. Each helper creates the minimum row needed and
 * accepts overrides so individual tests can customize without repeating
 * boilerplate. All builders return the full created row.
 */

export async function createMerchant(
  overrides: Partial<{
    email: string;
    name: string;
    balanceCents: bigint;
    referralCode: string;
    referredBy: string | null;
  }> = {}
) {
  const email =
    overrides.email ??
    `merchant-${crypto.randomBytes(4).toString('hex')}@example.com`;
  return testPrisma.merchant.create({
    data: {
      email,
      password: await bcrypt.hash('irrelevant', 4),
      name: overrides.name ?? 'Test Merchant',
      balance: overrides.balanceCents ?? 0n,
      referralCode: overrides.referralCode,
      referredBy: overrides.referredBy ?? null,
    },
  });
}

export async function createStore(merchantId: string, overrides: Partial<{ name: string }> = {}) {
  return testPrisma.store.create({
    data: {
      merchantId,
      name: overrides.name ?? 'Test Store',
      businessName: overrides.name ?? 'Test Store LLC',
    },
  });
}

export async function createOrder(
  merchantId: string,
  overrides: Partial<{
    esimAccessOrderNo: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    totalAmount: bigint;
    transactionId: string;
  }> = {}
) {
  return testPrisma.order.create({
    data: {
      merchantId,
      transactionId: overrides.transactionId ?? `tx-${crypto.randomBytes(4).toString('hex')}`,
      esimAccessOrderNo: overrides.esimAccessOrderNo ?? `B${crypto.randomBytes(4).toString('hex')}`,
      status: (overrides.status as any) ?? 'PENDING',
      totalAmount: overrides.totalAmount ?? 100_000n, // 1/10000 USD units
      packageCount: 1,
    },
  });
}

export async function createCustomerOrder(
  merchantId: string,
  storeId: string,
  overrides: Partial<{
    totalAmountCents: bigint;
    paymentIntentId: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  }> = {}
) {
  return testPrisma.customerOrder.create({
    data: {
      customerEmail: `cust-${crypto.randomBytes(3).toString('hex')}@example.com`,
      storeId,
      merchantId,
      totalAmount: overrides.totalAmountCents ?? 1000n, // cents
      paymentIntentId: overrides.paymentIntentId,
      packageCount: 1,
      status: (overrides.status as any) ?? 'PENDING',
    },
  });
}
