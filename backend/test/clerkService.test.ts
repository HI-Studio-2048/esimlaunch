import { describe, it, expect, vi } from 'vitest';
import { testPrisma } from './setup';
import { createMerchant } from './helpers';

/**
 * Round 10 Issue #152 fix: referral application is an atomic compare-and-set
 *   UPDATE "Merchant" SET referredBy = $affiliateId
 *   WHERE id = $merchantId AND referredBy IS NULL
 *
 * These tests validate that:
 *   - a valid referral attaches once
 *   - an invalid referral code returns 'invalid' and does not attach
 *   - a self-referral returns 'self' and does not attach
 *   - two concurrent `syncClerkUser` calls carrying different referral codes
 *     result in exactly one referral winning (no overwrite race)
 */

// We don't want to talk to the real Clerk API. `clerkClient.users.getUser`
// is only used by `getOrCreateMerchantFromClerk`; `syncClerkUser` itself
// does not touch Clerk, so this mock is a safety belt.
vi.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: { getUser: vi.fn() },
    verifyToken: vi.fn(),
  },
}));

import { clerkService } from '../src/services/clerkService';

describe('clerkService referral attribution', () => {
  it('attaches a valid referral to a newly-synced merchant', async () => {
    const affiliate = await createMerchant({ referralCode: 'AFFIL1' });

    const merchant = await clerkService.syncClerkUser(
      'clerk_user_a',
      'new-a@example.com',
      'New A',
      'AFFIL1'
    );

    expect((merchant as any).referralStatus).toBe('tracked');

    const row = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(row?.referredBy).toBe(affiliate.id);
  });

  it('returns "invalid" and does not attach when the code is unknown', async () => {
    const result = await clerkService.syncClerkUser(
      'clerk_user_b',
      'new-b@example.com',
      'New B',
      'DOES_NOT_EXIST'
    );
    expect((result as any).referralStatus).toBe('invalid');

    const row = await testPrisma.merchant.findUnique({ where: { id: result.id } });
    expect(row?.referredBy).toBeNull();
  });

  it('returns "self" when a merchant tries to use their own referral code', async () => {
    // First sync creates the merchant. We then give them a referralCode of
    // their own and try to attach it on a second sync.
    const created = await clerkService.syncClerkUser(
      'clerk_user_c',
      'self@example.com',
      'Self User'
    );
    await testPrisma.merchant.update({
      where: { id: created.id },
      data: { referralCode: 'SELFCODE' },
    });

    const result = await clerkService.syncClerkUser(
      'clerk_user_c',
      'self@example.com',
      'Self User',
      'SELFCODE'
    );
    expect((result as any).referralStatus).toBe('self');

    const row = await testPrisma.merchant.findUnique({ where: { id: created.id } });
    expect(row?.referredBy).toBeNull();
  });

  it('atomic CAS: two concurrent referral codes → exactly one wins', async () => {
    // Two affiliates with different referral codes.
    const affiliateA = await createMerchant({ referralCode: 'A_CODE' });
    const affiliateB = await createMerchant({ referralCode: 'B_CODE' });

    // Fire two concurrent syncClerkUser calls for the SAME new clerk user,
    // each carrying a different referral code. Without the atomic CAS, these
    // would interleave and one would overwrite the other.
    const [r1, r2] = await Promise.all([
      clerkService.syncClerkUser('clerk_user_race', 'race@example.com', 'Race', 'A_CODE'),
      clerkService.syncClerkUser('clerk_user_race', 'race@example.com', 'Race', 'B_CODE'),
    ]);

    expect(r1.id).toBe(r2.id); // same underlying merchant row

    const row = await testPrisma.merchant.findUnique({ where: { id: r1.id } });
    // Exactly one of the two affiliates must have won.
    expect([affiliateA.id, affiliateB.id]).toContain(row?.referredBy);

    // And exactly one of the two results should carry referralStatus: 'tracked'.
    // The other should be null (because by the time it tried, referredBy was
    // no longer null).
    const statuses = [(r1 as any).referralStatus, (r2 as any).referralStatus];
    const trackedCount = statuses.filter((s) => s === 'tracked').length;
    expect(trackedCount).toBe(1);
  });

  it('does not overwrite an existing referredBy even if a later sync carries a different code', async () => {
    const affiliateA = await createMerchant({ referralCode: 'FIRST_CODE' });
    await createMerchant({ referralCode: 'SECOND_CODE' });

    const merchant = await clerkService.syncClerkUser(
      'clerk_user_d',
      'd@example.com',
      'D',
      'FIRST_CODE'
    );
    expect((merchant as any).referralStatus).toBe('tracked');

    const second = await clerkService.syncClerkUser(
      'clerk_user_d',
      'd@example.com',
      'D',
      'SECOND_CODE'
    );
    // referredBy already set — CAS returns 0 rows affected → null status
    expect((second as any).referralStatus).toBeNull();

    const row = await testPrisma.merchant.findUnique({ where: { id: merchant.id } });
    expect(row?.referredBy).toBe(affiliateA.id);
  });
});
