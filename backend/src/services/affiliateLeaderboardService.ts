import { prisma } from '../lib/prisma';
import { isoWeekUTC } from '../config/affiliate';

type Range = 'all' | 'month' | 'week';

type LeaderboardRow = {
  rank: number;
  handle: string;
  tier: string;
  earnings: number; // dollars
  avatarSeed: string;
  isMe?: boolean;
};

function windowStart(range: Range, now: Date = new Date()): Date | null {
  if (range === 'all') return null;
  if (range === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (range === 'week') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - (day - 1));
    return d;
  }
  return null;
}

export async function getLeaderboard(range: Range, currentMerchantId: string): Promise<{
  range: Range;
  top: LeaderboardRow[];
  me: LeaderboardRow | null;
}> {
  const start = windowStart(range);

  // Aggregate real earnings per merchant where status='paid'
  const real = await prisma.affiliateCommission.groupBy({
    by: ['affiliateId'],
    where: {
      status: 'paid',
      ...(start ? { paidAt: { gte: start } } : {}),
    },
    _sum: { amount: true },
  });

  const merchantIds = real.map(r => r.affiliateId);
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true, affiliateHandle: true, affiliateTier: true },
  });
  const merchantMap = new Map(merchants.map(m => [m.id, m]));

  const realRows = real
    .map(r => {
      const m = merchantMap.get(r.affiliateId);
      if (!m?.affiliateHandle) return null;
      return {
        handle: m.affiliateHandle,
        tier: m.affiliateTier,
        earnings: Number(r._sum.amount ?? 0n) / 100,
        avatarSeed: m.affiliateHandle,
        affiliateId: r.affiliateId,
      };
    })
    .filter(Boolean) as Array<LeaderboardRow & { affiliateId: string }>;

  // Merge mocks
  const mocks = await prisma.affiliateLeaderboardMock.findMany();
  const mockField = range === 'all' ? 'earningsAllTime' : range === 'month' ? 'earningsMonth' : 'earningsWeek';
  const mockRows = mocks.map(m => ({
    handle: m.handle,
    tier: m.tier,
    earnings: Number((m as any)[mockField]) / 100,
    avatarSeed: m.handle,
    affiliateId: null as string | null,
  }));

  const combined = [...realRows, ...mockRows]
    .filter(r => r.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const top = combined.slice(0, 10).map(({ affiliateId, ...row }) => ({
    ...row,
    isMe: affiliateId === currentMerchantId,
  }));

  const meRow = combined.find(r => r.affiliateId === currentMerchantId);
  const me: LeaderboardRow | null = meRow
    ? { rank: meRow.rank, handle: meRow.handle, tier: meRow.tier, earnings: meRow.earnings, avatarSeed: meRow.avatarSeed, isMe: true }
    : null;

  return { range, top, me };
}
