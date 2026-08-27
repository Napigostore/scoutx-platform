-- AlterTable: Add selectionMode, disputeMode, maxParticipants to missions
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "selectionMode" TEXT NOT NULL DEFAULT 'AUTO';
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "disputeMode" TEXT NOT NULL DEFAULT 'DISABLED';
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "maxParticipants" INTEGER;

-- CreateTable: survey_participants
CREATE TABLE IF NOT EXISTS "survey_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "evidenceId" UUID,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "selectedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "survey_participants_missionId_userId_key" ON "survey_participants"("missionId", "userId");
CREATE INDEX IF NOT EXISTS "survey_participants_missionId_status_idx" ON "survey_participants"("missionId", "status");
CREATE INDEX IF NOT EXISTS "survey_participants_userId_idx" ON "survey_participants"("userId");

-- AddForeignKeys
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
