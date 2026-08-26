-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MissionVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INDIVIDUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "visibility" "MissionVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN IF NOT EXISTS "publicLogs" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "missions_visibility_idx" ON "missions"("visibility");

-- CreateTable
CREATE TABLE IF NOT EXISTS "mission_recipients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mission_recipients_userId_idx" ON "mission_recipients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "mission_recipients_missionId_userId_key" ON "mission_recipients"("missionId", "userId");

-- AddForeignKey
ALTER TABLE "mission_recipients" DROP CONSTRAINT IF EXISTS "mission_recipients_missionId_fkey";
ALTER TABLE "mission_recipients" ADD CONSTRAINT "mission_recipients_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_recipients" DROP CONSTRAINT IF EXISTS "mission_recipients_userId_fkey";
ALTER TABLE "mission_recipients" ADD CONSTRAINT "mission_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
