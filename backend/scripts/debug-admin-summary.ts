import { prisma } from '../src/lib/prisma';

async function main() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalMerchants,
    activeMerchants,
    totalStores,
    newMerchantsLast7,
    newMerchantsLast30,
    newStoresLast7,
    activeSubscriptions,
    todayNewMerchants,
    todayNewStores,
    openTickets,
  ] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { isActive: true } }),
    prisma.store.count(),
    prisma.merchant.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.merchant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.store.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.merchant.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.store.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
  ]);

  const todayMerchantsList = await prisma.merchant.findMany({
    where: { createdAt: { gte: todayStart } },
    select: { id: true, email: true, name: true, serviceType: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const todayStoresList = await prisma.store.findMany({
    where: { createdAt: { gte: todayStart } },
    select: {
      id: true,
      name: true,
      businessName: true,
      subdomain: true,
      adminStatus: true,
      createdAt: true,
      merchant: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(
    JSON.stringify(
      {
        kpis: {
          totalMerchants,
          activeMerchants,
          totalStores,
          activeSubscriptions,
          newMerchantsLast7,
          newMerchantsLast30,
          newStoresLast7,
          openTickets,
        },
        today: {
          newMerchants: todayNewMerchants,
          newStores: todayNewStores,
          merchants: todayMerchantsList,
          stores: todayStoresList,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error('Summary debug error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

