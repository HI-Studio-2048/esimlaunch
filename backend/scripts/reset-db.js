#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * This script will:
 * 1. Drop all data and tables from the database
 * 2. Recreate the schema from schema.prisma (using db push)
 * 
 * WARNING: This will delete ALL data in your database!
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Resetting database...\n');

try {
  // Change to backend directory
  const backendDir = path.join(__dirname, '..');
  process.chdir(backendDir);

  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n🗑️  Dropping all tables and recreating schema...');
  console.log('   (This uses db push which syncs directly from schema.prisma)');
  
  // Use db push with force-reset instead of migrate reset
  // This is more reliable as it syncs directly from schema.prisma
  // without relying on migration files that might have dependency issues
  execSync('npx prisma db push --force-reset --accept-data-loss', { stdio: 'inherit' });

  console.log('\n✅ Database reset complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Clear your browser localStorage:');
  console.log('      - Open DevTools (F12) → Application → Local Storage → Clear');
  console.log('      - Or run in console: localStorage.clear(); sessionStorage.clear();');
  console.log('   2. Restart your backend server');
  console.log('   3. Sign up again to create a fresh account\n');

} catch (error) {
  console.error('\n❌ Error resetting database:', error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('   - Make sure PostgreSQL is running');
  console.error('   - Check your DATABASE_URL in .env');
  console.error('   - Try manually: npx prisma db push --force-reset --accept-data-loss');
  process.exit(1);
}

