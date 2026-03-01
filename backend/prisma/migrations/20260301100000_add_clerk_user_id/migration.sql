-- Add Clerk user ID to Merchant for Clerk auth sync
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Merchant_clerkUserId_key" ON "Merchant"("clerkUserId");
