import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { affiliateService } from '../../src/services/affiliateService';

describe('affiliateService.createCommission (type=order)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses per-order rate matching the affiliate tier', async () => {
    vi.spyOn(prisma.merchant, 'findUnique').mockResolvedValue({
      id: 'm1',
      affiliateTier: 'gold',
    } as any);
    const createSpy = vi.spyOn(prisma.affiliateCommission, 'create').mockResolvedValue({} as any);

    await affiliateService.createCommission({
      affiliateId: 'm1',
      customerOrderId: 'o1',
      amount: 10000,
      type: 'order',
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          commissionRate: 15,
          amount: BigInt(1500),
          type: 'order',
        }),
      }),
    );
  });
});
