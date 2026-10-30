-- AlterEnum
ALTER TYPE "CreditSource" ADD VALUE 'SMS_PURCHASE';

-- AlterTable
ALTER TABLE "schools" ADD COLUMN "sms_credit_balance" DECIMAL(19,4) NOT NULL DEFAULT 0;
