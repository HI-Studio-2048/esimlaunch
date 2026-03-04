-- CreateEnum
CREATE TYPE "MerchantRole" AS ENUM ('MERCHANT', 'ADMIN');

-- DropForeignKey
ALTER TABLE "CustomerOrder" DROP CONSTRAINT "CustomerOrder_orderId_fkey";

-- DropIndex
DROP INDEX "Merchant_affiliateCode_idx";

-- DropIndex
DROP INDEX "Merchant_referralCode_idx";

-- DropIndex
DROP INDEX "Merchant_referredBy_idx";

-- DropIndex
DROP INDEX "Order_customerOrderId_idx";

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "role" "MerchantRole" NOT NULL DEFAULT 'MERCHANT';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "adminStatus" TEXT NOT NULL DEFAULT 'pending_review';

-- CreateIndex
CREATE INDEX "Merchant_role_idx" ON "Merchant"("role");
