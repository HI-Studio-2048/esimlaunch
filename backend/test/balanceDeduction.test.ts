import { describe, it, expect } from 'vitest';
import { testPrisma } from './setup';
import { createMerchant } from './helpers';

/**
 * The atomic balance-deduction primitive (in api.ts, customerOrderService.ts,
 * and topup refund paths) looks like:
 *
 *   UPDATE "Merchant"
 *   SET balance = balance - $chargeCents
 *   WHERE id = $merchantId AND balance >= $chargeCents
 *
 * This test pounds that statement concurrently to prove it never
 * double-spends: the WHERE clause is the safety invariant. If it were
 * implemented as SELECT-then-UPDATE, interleaved tests would happily
 * deduct past zero.
 */

async function deductOrFail(merchantId: string, chargeCents: bigint): Promise<boolean> {
  const rows = await testPrisma.$executeRaw`
    UPDATE "Merchant"
    SET balance = balance - ${chargeCents}
    WHERE id = ${merchantId} AND balance >= ${chargeCents}
  `;
  return rows > 0;
}

describe('atomic balance deduction', () => {
  it('never double-spends under concurrent deductions', async () => {
    const merchant = await createMerchant({ balanceCents: 5_000n }); // enough for exactly 5 at 1000 each
    const charge = 1_000n;

    // Fire 10 concurrent deductions. Exactly 5 should succeed.
    const results = await Promise.all(
      Array.from({ length: 10 }, () => deductOrFail(merchant.id, charge))
    );

    const successes = results.filter(Boolean).length;
    expect(successes).toBe(5);

    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(0n);
  });

  it('rejects a deduction when balance is insufficient', async () => {
    const merchant = await createMerchant({ balanceCents: 100n });
    const ok = await deductOrFail(merchant.id, 200n);
    expect(ok).toBe(false);

    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(100n); // unchanged
  });

  it('succeeds exactly at the boundary (balance === chargeCents)', async () => {
    const merchant = await createMerchant({ balanceCents: 750n });
    const ok = await deductOrFail(merchant.id, 750n);
    expect(ok).toBe(true);

    const after = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(after?.balance).toBe(0n);
  });
});
