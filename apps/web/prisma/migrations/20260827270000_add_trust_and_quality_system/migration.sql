-- AlterTable: Add trust targeting fields to missions
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "minimumTrustScore" INTEGER;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "minimumQualityScore" INTEGER;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "minimumCompletedMissions" INTEGER;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "verifiedOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: worker_trust_profiles
CREATE TABLE IF NOT EXISTS "worker_trust_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "fraudRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedMissions" INTEGER NOT NULL DEFAULT 0,
    "approvedMissions" INTEGER NOT NULL DEFAULT 0,
    "rejectedMissions" INTEGER NOT NULL DEFAULT 0,
    "disputedMissions" INTEGER NOT NULL DEFAULT 0,
    "wonMissions" INTEGER NOT NULL DEFAULT 0,
    "surveyCompleted" INTEGER NOT NULL DEFAULT 0,
    "surveyRejected" INTEGER NOT NULL DEFAULT 0,
    "suspiciousCount" INTEGER NOT NULL DEFAULT 0,
    "evidenceApproved" INTEGER NOT NULL DEFAULT 0,
    "evidenceRejected" INTEGER NOT NULL DEFAULT 0,
    "accountAgeDays" INTEGER NOT NULL DEFAULT 0,
    "profileVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_trust_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "worker_trust_profiles_userId_key" ON "worker_trust_profiles"("userId");
CREATE INDEX IF NOT EXISTS "worker_trust_profiles_userId_idx" ON "worker_trust_profiles"("userId");
CREATE INDEX IF NOT EXISTS "worker_trust_profiles_trustScore_idx" ON "worker_trust_profiles"("trustScore");
CREATE INDEX IF NOT EXISTS "worker_trust_profiles_qualityScore_idx" ON "worker_trust_profiles"("qualityScore");
CREATE INDEX IF NOT EXISTS "worker_trust_profiles_fraudRiskScore_idx" ON "worker_trust_profiles"("fraudRiskScore");
CREATE INDEX IF NOT EXISTS "worker_trust_profiles_lastCalculatedAt_idx" ON "worker_trust_profiles"("lastCalculatedAt");

-- AddForeignKey
ALTER TABLE "worker_trust_profiles" ADD CONSTRAINT "worker_trust_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
