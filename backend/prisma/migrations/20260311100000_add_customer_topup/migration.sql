-- CreateTable: CustomerTopUp
CREATE TABLE IF NOT EXISTS "CustomerTopUp" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "iccid" TEXT,
    "esimTranNo" TEXT,
    "packageCode" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTopUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerTopUp_merchantId_idx" ON "CustomerTopUp"("merchantId");
CREATE INDEX IF NOT EXISTS "CustomerTopUp_customerEmail_idx" ON "CustomerTopUp"("customerEmail");
CREATE INDEX IF NOT EXISTS "CustomerTopUp_iccid_idx" ON "CustomerTopUp"("iccid");
CREATE INDEX IF NOT EXISTS "CustomerTopUp_createdAt_idx" ON "CustomerTopUp"("createdAt");

ALTER TABLE "CustomerTopUp" ADD CONSTRAINT "CustomerTopUp_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
