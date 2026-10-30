-- CreateEnum
CREATE TYPE "SmsPackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "sms_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "SmsPackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_credit_purchases" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "external_reference" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "sms_credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_packages_name_key" ON "sms_packages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sms_packages_code_key" ON "sms_packages"("code");

-- AddForeignKey
ALTER TABLE "sms_credit_purchases" ADD CONSTRAINT "sms_credit_purchases_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_credit_purchases" ADD CONSTRAINT "sms_credit_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "sms_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
