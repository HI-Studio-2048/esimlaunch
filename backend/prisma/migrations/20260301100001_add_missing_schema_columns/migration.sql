-- Merchant: columns present in schema but never added by any migration
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3);
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "balance" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "smtpHost" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "smtpPort" INTEGER;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "smtpUser" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "smtpPass" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "smtpFromName" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "smtpFromEmail" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Merchant_emailVerificationToken_key" ON "Merchant"("emailVerificationToken");

-- Store: columns present in schema but never added by any migration
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "templateKey" TEXT DEFAULT 'default';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "templateSettings" JSONB;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "domainVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "domainVerificationMethod" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "domainVerificationToken" TEXT;
