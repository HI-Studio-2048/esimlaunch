import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handles = [
  { handle: 'marcusT',       tier: 'platinum' },
  { handle: 'jenna_sales',   tier: 'platinum' },
  { handle: 'ryanKO',        tier: 'gold' },
  { handle: 'priya_m',       tier: 'gold' },
  { handle: 'danielcr',      tier: 'gold' },
  { handle: 'sofia_diaz',    tier: 'silver' },
  { handle: 'alexwong88',    tier: 'silver' },
  { handle: 'nour_h',        tier: 'silver' },
  { handle: 'chrisbell',     tier: 'silver' },
  { handle: 'amira_k',       tier: 'silver' },
  { handle: 'tommyJ',        tier: 'bronze' },
  { handle: 'lina_travel',   tier: 'bronze' },
  { handle: 'kevinp92',      tier: 'bronze' },
  { handle: 'fatima_r',      tier: 'bronze' },
  { handle: 'jakemorris',    tier: 'bronze' },
  { handle: 'meilin_w',      tier: 'bronze' },
  { handle: 'oscar_dev',     tier: 'bronze' },
  { handle: 'hana_s',        tier: 'bronze' },
  { handle: 'mattgriff',     tier: 'bronze' },
  { handle: 'leila_n',       tier: 'bronze' },
  { handle: 'sam_connects',  tier: 'bronze' },
  { handle: 'yuki_tanaka',   tier: 'bronze' },
  { handle: 'benwright',     tier: 'bronze' },
  { handle: 'clara_j',       tier: 'bronze' },
  { handle: 'aditya_p',      tier: 'bronze' },
];

async function main() {
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i];
    // Earnings decay logarithmically by rank. Top ~ $8,400, bottom ~ $12.
    const alltime = Math.round(Math.max(1200, 840000 * Math.pow(0.82, i)));
    const month = Math.round(alltime * 0.18);
    const week = Math.round(alltime * 0.045);
    await prisma.affiliateLeaderboardMock.upsert({
      where: { handle: h.handle },
      update: { tier: h.tier, earningsAllTime: BigInt(alltime), earningsMonth: BigInt(month), earningsWeek: BigInt(week) },
      create: { handle: h.handle, tier: h.tier, earningsAllTime: BigInt(alltime), earningsMonth: BigInt(month), earningsWeek: BigInt(week) },
    });
  }
  console.log(`Seeded ${handles.length} leaderboard mock rows`);
}

main().finally(() => prisma.$disconnect());
