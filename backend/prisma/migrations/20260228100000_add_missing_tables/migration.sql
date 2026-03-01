-- CreateEnum
CREATE TYPE "BalanceTransactionType" AS ENUM ('ORDER', 'REFUND', 'TOPUP', 'ADJUSTMENT');

-- CreateTable: BalanceTransaction
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" BIGINT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentIntent
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "stripeIntentId" TEXT NOT NULL,
    "merchantId" TEXT,
    "storeId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EsimProfile
CREATE TABLE "EsimProfile" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "esimTranNo" TEXT NOT NULL,
    "iccid" TEXT,
    "orderNo" TEXT,
    "orderId" TEXT,
    "transactionId" TEXT,
    "packageCode" TEXT,
    "packageName" TEXT,
    "planPrice" INTEGER,
    "supportTopUpType" TEXT,
    "locationCode" TEXT,
    "coverage" JSONB,
    "ac" TEXT,
    "qrCodeUrl" TEXT,
    "shortUrl" TEXT,
    "apn" TEXT,
    "smsStatus" INTEGER,
    "dataType" INTEGER,
    "activeType" INTEGER,
    "nickname" TEXT,
    "notes" TEXT,
    "orderedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsimProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmailTemplate
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- Order.customerOrderId (link Order to CustomerOrder)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerOrderId" TEXT;

-- Unique and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_stripeIntentId_key" ON "PaymentIntent"("stripeIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "EsimProfile_esimTranNo_key" ON "EsimProfile"("esimTranNo");

CREATE INDEX IF NOT EXISTS "BalanceTransaction_merchantId_idx" ON "BalanceTransaction"("merchantId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_orderId_idx" ON "BalanceTransaction"("orderId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_type_idx" ON "BalanceTransaction"("type");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_createdAt_idx" ON "BalanceTransaction"("createdAt");

CREATE INDEX IF NOT EXISTS "PaymentIntent_merchantId_idx" ON "PaymentIntent"("merchantId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_storeId_idx" ON "PaymentIntent"("storeId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_status_idx" ON "PaymentIntent"("status");
CREATE INDEX IF NOT EXISTS "PaymentIntent_stripeIntentId_idx" ON "PaymentIntent"("stripeIntentId");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_merchantId_idx" ON "PasswordResetToken"("merchantId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE INDEX IF NOT EXISTS "Session_merchantId_idx" ON "Session"("merchantId");
CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE INDEX IF NOT EXISTS "EsimProfile_merchantId_idx" ON "EsimProfile"("merchantId");
CREATE INDEX IF NOT EXISTS "EsimProfile_esimTranNo_idx" ON "EsimProfile"("esimTranNo");
CREATE INDEX IF NOT EXISTS "EsimProfile_iccid_idx" ON "EsimProfile"("iccid");
CREATE INDEX IF NOT EXISTS "EsimProfile_orderNo_idx" ON "EsimProfile"("orderNo");
CREATE INDEX IF NOT EXISTS "EsimProfile_orderId_idx" ON "EsimProfile"("orderId");
CREATE INDEX IF NOT EXISTS "EsimProfile_createdAt_idx" ON "EsimProfile"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_merchantId_templateId_key" ON "EmailTemplate"("merchantId", "templateId");
CREATE INDEX IF NOT EXISTS "EmailTemplate_merchantId_idx" ON "EmailTemplate"("merchantId");
CREATE INDEX IF NOT EXISTS "EmailTemplate_templateId_idx" ON "EmailTemplate"("templateId");

CREATE UNIQUE INDEX IF NOT EXISTS "Order_customerOrderId_key" ON "Order"("customerOrderId");
CREATE INDEX IF NOT EXISTS "Order_customerOrderId_idx" ON "Order"("customerOrderId");

-- Foreign keys
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EsimProfile" ADD CONSTRAINT "EsimProfile_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_customerOrderId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "CustomerOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
