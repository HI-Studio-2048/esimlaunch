import { beforeAll, beforeEach, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Test harness:
 *   - Requires TEST_DATABASE_URL pointing at an isolated Postgres database.
 *     Never use your real DB — every test run truncates every table.
 *   - On first run, `prisma migrate deploy` is applied so the schema matches
 *     the source tree.
 *   - Before each test, all tables are truncated and identities reset so
 *     tests start from a clean slate.
 */

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Point it at a disposable Postgres DB, e.g. ' +
      '"postgresql://esimlaunch:esimlaunch_password@localhost:5432/esimlaunch_test"'
  );
}

// Make every Prisma client created during tests use the test DB.
process.env.DATABASE_URL = TEST_DATABASE_URL;

// Dedicated Prisma client for table-truncation SQL. We intentionally don't
// reuse src/lib/prisma.ts so the production singleton stays out of the
// hot-path here.
export const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });

beforeAll(async () => {
  // Apply migrations once per run. `migrate deploy` is idempotent.
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
  await testPrisma.$connect();
});

beforeEach(async () => {
  // Truncate every user table. We discover them from the information_schema
  // so this stays correct as the Prisma schema evolves. `_prisma_migrations`
  // is deliberately preserved.
  const rows: Array<{ tablename: string }> = await testPrisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  );
  if (rows.length === 0) return;
  const quoted = rows.map((r) => `"${r.tablename}"`).join(', ');
  await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
