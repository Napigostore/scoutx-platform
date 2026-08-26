-- AlterTable
ALTER TABLE "mission_submissions" ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT;
