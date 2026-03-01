-- Add currency fields to Store
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "defaultCurrency" TEXT DEFAULT 'USD';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "supportedCurrencies" JSONB;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "seoConfig" JSONB;

-- Add affiliate fields to Merchant
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "affiliateCode" TEXT UNIQUE;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE;

-- CreateIndex for Merchant affiliate fields
CREATE INDEX IF NOT EXISTS "Merchant_affiliateCode_idx" ON "Merchant"("affiliateCode");
CREATE INDEX IF NOT EXISTS "Merchant_referralCode_idx" ON "Merchant"("referralCode");
CREATE INDEX IF NOT EXISTS "Merchant_referredBy_idx" ON "Merchant"("referredBy");

-- CreateTable: AffiliateCommission
CREATE TABLE IF NOT EXISTS "AffiliateCommission" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referredMerchantId" TEXT,
    "orderId" TEXT,
    "customerOrderId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AffiliateCommission indexes
CREATE INDEX IF NOT EXISTS "AffiliateCommission_affiliateId_idx" ON "AffiliateCommission"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateCommission_referredMerchantId_idx" ON "AffiliateCommission"("referredMerchantId");
CREATE INDEX IF NOT EXISTS "AffiliateCommission_orderId_idx" ON "AffiliateCommission"("orderId");
CREATE INDEX IF NOT EXISTS "AffiliateCommission_customerOrderId_idx" ON "AffiliateCommission"("customerOrderId");
CREATE INDEX IF NOT EXISTS "AffiliateCommission_status_idx" ON "AffiliateCommission"("status");
CREATE INDEX IF NOT EXISTS "AffiliateCommission_createdAt_idx" ON "AffiliateCommission"("createdAt");

-- AddForeignKey: AffiliateCommission -> Merchant (affiliate)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'AffiliateCommission_affiliateId_fkey'
    ) THEN
        ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" 
        FOREIGN KEY ("affiliateId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: AffiliateCommission -> Merchant (referredMerchant)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'AffiliateCommission_referredMerchantId_fkey'
    ) THEN
        ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_referredMerchantId_fkey" 
        FOREIGN KEY ("referredMerchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: AffiliateCommission -> CustomerOrder
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'AffiliateCommission_customerOrderId_fkey'
    ) THEN
        ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_customerOrderId_fkey" 
        FOREIGN KEY ("customerOrderId") REFERENCES "CustomerOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
