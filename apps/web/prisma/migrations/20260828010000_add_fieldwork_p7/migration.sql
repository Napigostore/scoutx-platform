-- P7: Research Operations / Live Fieldwork

-- Add new fieldwork state tracking to SurveyParticipant
ALTER TABLE "survey_participants"
  ADD COLUMN IF NOT EXISTS "slotReservedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "startedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "abandonedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "qualityScore"   DOUBLE PRECISION;

-- CreateTable: survey_fieldwork
CREATE TABLE IF NOT EXISTS "survey_fieldwork" (
    "id"                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    "missionId"            UUID         NOT NULL,
    "status"               TEXT         NOT NULL DEFAULT 'RECRUITING',
    "startedAt"            TIMESTAMP(3),
    "pausedAt"             TIMESTAMP(3),
    "completedAt"          TIMESTAMP(3),
    "expiresAt"            TIMESTAMP(3) NOT NULL,
    "targetCompletes"      INTEGER      NOT NULL,
    "completedCount"       INTEGER      NOT NULL DEFAULT 0,
    "screenedCount"        INTEGER      NOT NULL DEFAULT 0,
    "rejectedCount"        INTEGER      NOT NULL DEFAULT 0,
    "qualityRejectedCount" INTEGER      NOT NULL DEFAULT 0,
    "disqualifiedCount"    INTEGER      NOT NULL DEFAULT 0,
    "reservedCount"        INTEGER      NOT NULL DEFAULT 0,
    "inProgressCount"      INTEGER      NOT NULL DEFAULT 0,
    "remainingBudget"      DOUBLE PRECISION NOT NULL,
    "lastActivityAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version"              INTEGER      NOT NULL DEFAULT 0,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_fieldwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fieldwork_events
CREATE TABLE IF NOT EXISTS "fieldwork_events" (
    "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID         NOT NULL,
    "workerId"  UUID,
    "type"      TEXT         NOT NULL,
    "metadata"  JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fieldwork_events_pkey" PRIMARY KEY ("id")
);

-- Unique / Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "survey_fieldwork_missionId_key" ON "survey_fieldwork"("missionId");
CREATE INDEX IF NOT EXISTS "survey_fieldwork_status_idx"    ON "survey_fieldwork"("status");
CREATE INDEX IF NOT EXISTS "survey_fieldwork_expiresAt_idx" ON "survey_fieldwork"("expiresAt");
CREATE INDEX IF NOT EXISTS "fieldwork_events_missionId_createdAt_idx" ON "fieldwork_events"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "fieldwork_events_missionId_type_idx"      ON "fieldwork_events"("missionId", "type");

-- ForeignKeys
ALTER TABLE "survey_fieldwork"  ADD CONSTRAINT "survey_fieldwork_missionId_fkey"  FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fieldwork_events"  ADD CONSTRAINT "fieldwork_events_missionId_fkey"  FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
