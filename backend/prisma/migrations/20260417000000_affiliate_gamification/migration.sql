-- AlterTable: AffiliateCommission — add type, metadata, stripeInvoiceId
ALTER TABLE "AffiliateCommission" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'order';
ALTER TABLE "AffiliateCommission" ADD COLUMN "metadata" JSONB;
ALTER TABLE "AffiliateCommission" ADD COLUMN "stripeInvoiceId" TEXT;

-- AlterTable: Merchant — add affiliateHandle, affiliateTier
ALTER TABLE "Merchant" ADD COLUMN "affiliateHandle" TEXT;
ALTER TABLE "Merchant" ADD COLUMN "affiliateTier" TEXT NOT NULL DEFAULT 'bronze';

-- CreateIndex: AffiliateCommission new indexes
CREATE INDEX "AffiliateCommission_type_idx" ON "AffiliateCommission"("type");
CREATE INDEX "AffiliateCommission_stripeInvoiceId_idx" ON "AffiliateCommission"("stripeInvoiceId");

-- CreateIndex: Merchant affiliateHandle unique
CREATE UNIQUE INDEX "Merchant_affiliateHandle_key" ON "Merchant"("affiliateHandle");

-- CreateTable: AffiliateBountyClaim
CREATE TABLE "AffiliateBountyClaim" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "bountyKey" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commissionId" TEXT,

    CONSTRAINT "AffiliateBountyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AffiliateBountyClaim
CREATE UNIQUE INDEX "AffiliateBountyClaim_commissionId_key" ON "AffiliateBountyClaim"("commissionId");
CREATE UNIQUE INDEX "AffiliateBountyClaim_merchantId_bountyKey_key" ON "AffiliateBountyClaim"("merchantId", "bountyKey");
CREATE INDEX "AffiliateBountyClaim_merchantId_idx" ON "AffiliateBountyClaim"("merchantId");

-- AddForeignKey: AffiliateBountyClaim → Merchant
ALTER TABLE "AffiliateBountyClaim" ADD CONSTRAINT "AffiliateBountyClaim_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AffiliateBountyClaim → AffiliateCommission
ALTER TABLE "AffiliateBountyClaim" ADD CONSTRAINT "AffiliateBountyClaim_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "AffiliateCommission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: AffiliateWeeklyProgress
CREATE TABLE "AffiliateWeeklyProgress" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "isoWeek" TEXT NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "bronzePaid" BOOLEAN NOT NULL DEFAULT false,
    "silverPaid" BOOLEAN NOT NULL DEFAULT false,
    "goldPaid" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateWeeklyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AffiliateWeeklyProgress
CREATE UNIQUE INDEX "AffiliateWeeklyProgress_merchantId_isoWeek_key" ON "AffiliateWeeklyProgress"("merchantId", "isoWeek");
CREATE INDEX "AffiliateWeeklyProgress_merchantId_idx" ON "AffiliateWeeklyProgress"("merchantId");
CREATE INDEX "AffiliateWeeklyProgress_isoWeek_idx" ON "AffiliateWeeklyProgress"("isoWeek");

-- AddForeignKey: AffiliateWeeklyProgress → Merchant
ALTER TABLE "AffiliateWeeklyProgress" ADD CONSTRAINT "AffiliateWeeklyProgress_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: AffiliateLeaderboardMock
CREATE TABLE "AffiliateLeaderboardMock" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "earningsAllTime" BIGINT NOT NULL,
    "earningsMonth" BIGINT NOT NULL,
    "earningsWeek" BIGINT NOT NULL,

    CONSTRAINT "AffiliateLeaderboardMock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AffiliateLeaderboardMock
CREATE UNIQUE INDEX "AffiliateLeaderboardMock_handle_key" ON "AffiliateLeaderboardMock"("handle");
