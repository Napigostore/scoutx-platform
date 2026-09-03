-- P8: Research Intelligence & Quality Automation

-- CreateTable: research_anomalies
CREATE TABLE IF NOT EXISTS "research_anomalies" (
    "id"          UUID             NOT NULL DEFAULT gen_random_uuid(),
    "missionId"   UUID             NOT NULL,
    "workerId"    UUID,
    "type"        TEXT             NOT NULL,
    "severity"    TEXT             NOT NULL,
    "score"       DOUBLE PRECISION NOT NULL,
    "evidence"    JSONB            NOT NULL,
    "status"      TEXT             NOT NULL DEFAULT 'OPEN',
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt"  TIMESTAMP(3),

    CONSTRAINT "research_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: research_recommendations
CREATE TABLE IF NOT EXISTS "research_recommendations" (
    "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
    "missionId"      UUID         NOT NULL,
    "type"           TEXT         NOT NULL,
    "payload"        JSONB        NOT NULL,
    "rationale"      TEXT         NOT NULL,
    "status"         TEXT         NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt"     TIMESTAMP(3),

    CONSTRAINT "research_recommendations_pkey" PRIMARY KEY ("id")
);

-- Unique / Indexes
CREATE INDEX IF NOT EXISTS "research_anomalies_missionId_status_idx"    ON "research_anomalies"("missionId", "status");
CREATE INDEX IF NOT EXISTS "research_anomalies_missionId_createdAt_idx" ON "research_anomalies"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "research_anomalies_missionId_type_idx"      ON "research_anomalies"("missionId", "type");

CREATE UNIQUE INDEX IF NOT EXISTS "research_recommendations_idempotencyKey_key" ON "research_recommendations"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "research_recommendations_missionId_status_idx"    ON "research_recommendations"("missionId", "status");
CREATE INDEX IF NOT EXISTS "research_recommendations_missionId_createdAt_idx" ON "research_recommendations"("missionId", "createdAt");

-- ForeignKeys
ALTER TABLE "research_anomalies"       ADD CONSTRAINT "research_anomalies_missionId_fkey"       FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_anomalies"       ADD CONSTRAINT "research_anomalies_workerId_fkey"        FOREIGN KEY ("workerId")  REFERENCES "users"("id")    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "research_recommendations" ADD CONSTRAINT "research_recommendations_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
