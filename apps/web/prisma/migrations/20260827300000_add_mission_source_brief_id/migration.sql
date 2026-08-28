-- Additive: add sourceBriefId traceability column to missions
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "sourceBriefId" UUID;
CREATE INDEX IF NOT EXISTS "missions_sourceBriefId_idx" ON "missions"("sourceBriefId");
