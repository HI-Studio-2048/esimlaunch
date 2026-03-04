const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.merchant.updateMany({
    where: { email: 'admin@esimlaunch.com' },
    data: { role: 'ADMIN' },
  });
  console.log('Updated merchants with ADMIN role:', result.count);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
