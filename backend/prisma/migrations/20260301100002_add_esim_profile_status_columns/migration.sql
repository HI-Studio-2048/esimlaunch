-- Add live status columns for eSIM profiles (from eSIM Access API)
ALTER TABLE "EsimProfile" ADD COLUMN IF NOT EXISTS "esimStatus" TEXT;
ALTER TABLE "EsimProfile" ADD COLUMN IF NOT EXISTS "smdpStatus" TEXT;
