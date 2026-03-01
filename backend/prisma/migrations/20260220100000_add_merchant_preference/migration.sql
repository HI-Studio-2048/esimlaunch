-- CreateTable: MerchantPreference (DB-backed preferences, no localStorage)
CREATE TABLE IF NOT EXISTS "MerchantPreference" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MerchantPreference_merchantId_key_key" ON "MerchantPreference"("merchantId", "key");
CREATE INDEX IF NOT EXISTS "MerchantPreference_merchantId_idx" ON "MerchantPreference"("merchantId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MerchantPreference_merchantId_fkey') THEN
        ALTER TABLE "MerchantPreference" ADD CONSTRAINT "MerchantPreference_merchantId_fkey"
        FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
