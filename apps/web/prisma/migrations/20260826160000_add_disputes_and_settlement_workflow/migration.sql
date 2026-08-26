-- AlterEnum
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'PENDING_REQUESTER_ACCEPTANCE';
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'COMPLETED_PENDING_SETTLEMENT';
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'COMMUNITY_VOTING';
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'VOTING_FINALIZED';
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'SETTLEMENT_PENDING';
ALTER TYPE "MissionStatus" ADD VALUE IF NOT EXISTS 'REWARDED';

-- AlterTable missions
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "winnerId" UUID,
ADD COLUMN IF NOT EXISTS "completionRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "settlementStartedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rewardReleasedAt" TIMESTAMP(3);

-- CreateTable disputes
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "initiatorId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "fundedCoin" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "disputes_missionId_key" ON "disputes"("missionId");

-- CreateTable dispute_evidences
CREATE TABLE IF NOT EXISTS "dispute_evidences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "disputeId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dispute_evidences_disputeId_idx" ON "dispute_evidences"("disputeId");

-- CreateTable dispute_rounds
CREATE TABLE IF NOT EXISTS "dispute_rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "disputeId" UUID NOT NULL,
    "roundNumber" INTEGER NOT NULL DEFAULT 1,
    "minVotesRequired" INTEGER NOT NULL DEFAULT 50,
    "fundedCoin" INTEGER NOT NULL DEFAULT 0,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "winningSide" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dispute_rounds_disputeId_roundNumber_idx" ON "dispute_rounds"("disputeId", "roundNumber");

-- CreateTable dispute_votes
CREATE TABLE IF NOT EXISTS "dispute_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "disputeId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "voterId" UUID NOT NULL,
    "selectedSide" TEXT NOT NULL,
    "rewardCoin" INTEGER NOT NULL DEFAULT 1,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "dispute_votes_roundId_voterId_key" ON "dispute_votes"("roundId", "voterId");
CREATE INDEX IF NOT EXISTS "dispute_votes_disputeId_idx" ON "dispute_votes"("disputeId");

-- AddForeignKeys
ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_missionId_fkey";
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_initiatorId_fkey";
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispute_evidences" DROP CONSTRAINT IF EXISTS "dispute_evidences_disputeId_fkey";
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispute_evidences" DROP CONSTRAINT IF EXISTS "dispute_evidences_ownerId_fkey";
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispute_rounds" DROP CONSTRAINT IF EXISTS "dispute_rounds_disputeId_fkey";
ALTER TABLE "dispute_rounds" ADD CONSTRAINT "dispute_rounds_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispute_votes" DROP CONSTRAINT IF EXISTS "dispute_votes_disputeId_fkey";
ALTER TABLE "dispute_votes" ADD CONSTRAINT "dispute_votes_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispute_votes" DROP CONSTRAINT IF EXISTS "dispute_votes_roundId_fkey";
ALTER TABLE "dispute_votes" ADD CONSTRAINT "dispute_votes_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "dispute_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispute_votes" DROP CONSTRAINT IF EXISTS "dispute_votes_voterId_fkey";
ALTER TABLE "dispute_votes" ADD CONSTRAINT "dispute_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
