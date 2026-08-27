-- AlterEnum: Add SURVEY to MissionCategory
ALTER TYPE "MissionCategory" ADD VALUE IF NOT EXISTS 'SURVEY';

-- AlterTable: Add survey fields to missions
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "rewardPerValidSubmissionCents" INTEGER;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "rewardBudgetCents" INTEGER;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "remainingBudgetCents" INTEGER;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "logVisibility" TEXT NOT NULL DEFAULT 'PRIVATE';
