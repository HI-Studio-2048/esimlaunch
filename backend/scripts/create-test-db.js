#!/usr/bin/env node
/**
 * Create the `esimlaunch_test` database in the local Postgres instance
 * running in the `esimlaunch-db` docker container. Idempotent.
 *
 * Usage:
 *   npm run test:db:create
 */
const { execSync } = require('child_process');

const TEST_DB = process.env.TEST_DB_NAME || 'esimlaunch_test';
const CONTAINER = process.env.POSTGRES_CONTAINER || 'esimlaunch-db';
const USER = process.env.POSTGRES_USER || 'postgres';

function psql(sql) {
  return execSync(
    `docker exec -i ${CONTAINER} psql -U ${USER} -d postgres -tAc ${JSON.stringify(sql)}`,
    { encoding: 'utf8' }
  ).trim();
}

try {
  const exists = psql(`SELECT 1 FROM pg_database WHERE datname = '${TEST_DB}'`);
  if (exists === '1') {
    console.log(`✓ Database "${TEST_DB}" already exists.`);
    process.exit(0);
  }
  psql(`CREATE DATABASE "${TEST_DB}"`);
  console.log(`✓ Created database "${TEST_DB}".`);
} catch (err) {
  console.error('Failed to create test DB:', err.message);
  process.exit(1);
}
