-- AlterTable
ALTER TABLE "TopUp" ADD COLUMN     "displayAmountCents" INTEGER,
ADD COLUMN     "displayCurrency" TEXT;

-- CreateIndex
CREATE INDEX "Commission_affiliateId_idx" ON "Commission"("affiliateId");

-- CreateIndex
CREATE INDEX "Commission_affiliateId_status_idx" ON "Commission"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "EsimProfile_userId_idx" ON "EsimProfile"("userId");

-- CreateIndex
CREATE INDEX "EsimUsageHistory_profileId_recordedAt_idx" ON "EsimUsageHistory"("profileId", "recordedAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_paymentRef_idx" ON "Order"("paymentRef");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_email_idx" ON "SupportTicket"("email");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "VCashTransaction_userId_createdAt_idx" ON "VCashTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VCashTransaction_userId_idx" ON "VCashTransaction"("userId");
