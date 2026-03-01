-- CreateTable: Customer
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomerOrder (must exist before we ALTER it below; created here if missing)
CREATE TABLE IF NOT EXISTS "CustomerOrder" (
    "id" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "storeId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "orderId" TEXT,
    "esimAccessOrderNo" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" BIGINT NOT NULL,
    "packageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerOrder_paymentIntentId_key" ON "CustomerOrder"("paymentIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerOrder_orderId_key" ON "CustomerOrder"("orderId");
CREATE INDEX IF NOT EXISTS "CustomerOrder_customerEmail_idx" ON "CustomerOrder"("customerEmail");
CREATE INDEX IF NOT EXISTS "CustomerOrder_storeId_idx" ON "CustomerOrder"("storeId");
CREATE INDEX IF NOT EXISTS "CustomerOrder_merchantId_idx" ON "CustomerOrder"("merchantId");
CREATE INDEX IF NOT EXISTS "CustomerOrder_paymentIntentId_idx" ON "CustomerOrder"("paymentIntentId");
CREATE INDEX IF NOT EXISTS "CustomerOrder_status_idx" ON "CustomerOrder"("status");
CREATE INDEX IF NOT EXISTS "CustomerOrder_createdAt_idx" ON "CustomerOrder"("createdAt");
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomerOrder_merchantId_fkey') THEN
        ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_merchantId_fkey"
        FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF; END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomerOrder_storeId_fkey') THEN
        ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_storeId_fkey"
        FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF; END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomerOrder_orderId_fkey') THEN
        ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF; END $$;

-- CreateTable: Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "stripeInvoiceId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "invoicePdf" TEXT,
    "hostedInvoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Customer email unique
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Customer_email_key') THEN
        CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
    END IF;
END $$;

-- CreateIndex: Customer email
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");

-- CreateIndex: Subscription merchantId unique
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Subscription_merchantId_key') THEN
        CREATE UNIQUE INDEX "Subscription_merchantId_key" ON "Subscription"("merchantId");
    END IF;
END $$;

-- CreateIndex: Subscription stripeSubscriptionId unique
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Subscription_stripeSubscriptionId_key') THEN
        CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
    END IF;
END $$;

-- CreateIndex: Subscription stripeCustomerId unique
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Subscription_stripeCustomerId_key') THEN
        CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
    END IF;
END $$;

-- CreateIndex: Subscription indexes
CREATE INDEX IF NOT EXISTS "Subscription_merchantId_idx" ON "Subscription"("merchantId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex: Invoice stripeInvoiceId unique
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Invoice_stripeInvoiceId_key') THEN
        CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");
    END IF;
END $$;

-- CreateIndex: Invoice indexes
CREATE INDEX IF NOT EXISTS "Invoice_merchantId_idx" ON "Invoice"("merchantId");
CREATE INDEX IF NOT EXISTS "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");
CREATE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_idx" ON "Invoice"("stripeInvoiceId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- AddForeignKey: Subscription -> Merchant
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Subscription_merchantId_fkey'
    ) THEN
        ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_merchantId_fkey" 
        FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Invoice -> Merchant
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_merchantId_fkey'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_merchantId_fkey" 
        FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Invoice -> Subscription
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_subscriptionId_fkey'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" 
        FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: Add customerId to CustomerOrder if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CustomerOrder' AND column_name = 'customerId'
    ) THEN
        ALTER TABLE "CustomerOrder" ADD COLUMN "customerId" TEXT;
    END IF;
END $$;

-- AddForeignKey: CustomerOrder -> Customer
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'CustomerOrder_customerId_fkey'
    ) THEN
        ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex: CustomerOrder customerId
CREATE INDEX IF NOT EXISTS "CustomerOrder_customerId_idx" ON "CustomerOrder"("customerId");
