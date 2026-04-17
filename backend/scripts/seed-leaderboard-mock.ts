import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handles = [
  { handle: 'eSIMKing',     tier: 'platinum' },
  { handle: 'RoamSultan',   tier: 'platinum' },
  { handle: 'DataDruid',    tier: 'gold' },
  { handle: 'Signalist',    tier: 'gold' },
  { handle: 'ByteBaron',    tier: 'gold' },
  { handle: 'GlobetrotterX',tier: 'silver' },
  { handle: 'SIMwhisperer', tier: 'silver' },
  { handle: 'NomadLord',    tier: 'silver' },
  { handle: 'ConnectedCat', tier: 'silver' },
  { handle: 'RoamerPrime',  tier: 'silver' },
  { handle: 'PacketNinja',  tier: 'bronze' },
  { handle: 'TetheredTux',  tier: 'bronze' },
  { handle: 'SIMpatico',    tier: 'bronze' },
  { handle: 'LatencyLord',  tier: 'bronze' },
  { handle: 'MegabitMogul', tier: 'bronze' },
  { handle: 'PortableGuru', tier: 'bronze' },
  { handle: 'GigaNomad',    tier: 'bronze' },
  { handle: 'eSIMCurious',  tier: 'bronze' },
  { handle: 'TravelTick',   tier: 'bronze' },
  { handle: 'RoamReady',    tier: 'bronze' },
  { handle: 'DigitalDrifter', tier: 'bronze' },
  { handle: 'FrequentFlier', tier: 'bronze' },
  { handle: 'WanderWatt',   tier: 'bronze' },
  { handle: 'BitByBit',     tier: 'bronze' },
  { handle: 'JustStartedOut', tier: 'bronze' },
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
