import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure admin settings singleton exists
  await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      mockMode: false,
      markupPercent: 0,
      defaultCurrency: 'USD',
      adminEmails: '',
    },
  });
  console.log('Seed complete: AdminSettings singleton created/verified.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
