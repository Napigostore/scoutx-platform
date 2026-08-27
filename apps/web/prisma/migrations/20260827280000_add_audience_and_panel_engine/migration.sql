-- CreateTable: audience_profiles
CREATE TABLE IF NOT EXISTS "audience_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "city" TEXT,
    "languages" JSONB,
    "employmentStatus" TEXT,
    "industry" TEXT,
    "jobTitle" TEXT,
    "education" TEXT,
    "incomeRange" TEXT,
    "deviceType" TEXT,
    "os" TEXT,
    "skills" JSONB,
    "interests" JSONB,
    "productUsage" JSONB,
    "purchaseBehavior" JSONB,
    "consentVersion" TEXT,
    "consentAt" TIMESTAMP(3),
    "profileCompletedPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: saved_audiences
CREATE TABLE IF NOT EXISTS "saved_audiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "estimatedEligibleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audience_members
CREATE TABLE IF NOT EXISTS "audience_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "audienceId" UUID NOT NULL,
    "workerId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastQualifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excludedAt" TIMESTAMP(3),

    CONSTRAINT "audience_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: research_participant_histories
CREATE TABLE IF NOT EXISTS "research_participant_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workerId" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completedAt" TIMESTAMP(3),
    "qualityScore" DOUBLE PRECISION,
    "rewardAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_participant_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "audience_profiles_userId_key" ON "audience_profiles"("userId");
CREATE INDEX IF NOT EXISTS "audience_profiles_userId_idx" ON "audience_profiles"("userId");
CREATE INDEX IF NOT EXISTS "audience_profiles_country_idx" ON "audience_profiles"("country");
CREATE INDEX IF NOT EXISTS "audience_profiles_industry_idx" ON "audience_profiles"("industry");
CREATE INDEX IF NOT EXISTS "audience_profiles_jobTitle_idx" ON "audience_profiles"("jobTitle");

CREATE INDEX IF NOT EXISTS "saved_audiences_requesterId_idx" ON "saved_audiences"("requesterId");

CREATE UNIQUE INDEX IF NOT EXISTS "audience_members_audienceId_workerId_key" ON "audience_members"("audienceId", "workerId");
CREATE INDEX IF NOT EXISTS "audience_members_audienceId_idx" ON "audience_members"("audienceId");
CREATE INDEX IF NOT EXISTS "audience_members_workerId_idx" ON "audience_members"("workerId");
CREATE INDEX IF NOT EXISTS "audience_members_status_idx" ON "audience_members"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "research_participant_histories_workerId_missionId_key" ON "research_participant_histories"("workerId", "missionId");
CREATE INDEX IF NOT EXISTS "research_participant_histories_workerId_idx" ON "research_participant_histories"("workerId");
CREATE INDEX IF NOT EXISTS "research_participant_histories_requesterId_idx" ON "research_participant_histories"("requesterId");
CREATE INDEX IF NOT EXISTS "research_participant_histories_missionId_idx" ON "research_participant_histories"("missionId");
CREATE INDEX IF NOT EXISTS "research_participant_histories_status_idx" ON "research_participant_histories"("status");
CREATE INDEX IF NOT EXISTS "research_participant_histories_createdAt_idx" ON "research_participant_histories"("createdAt");

-- AddForeignKeys
ALTER TABLE "audience_profiles" ADD CONSTRAINT "audience_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_audiences" ADD CONSTRAINT "saved_audiences_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audience_members" ADD CONSTRAINT "audience_members_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "saved_audiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audience_members" ADD CONSTRAINT "audience_members_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_participant_histories" ADD CONSTRAINT "research_participant_histories_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_participant_histories" ADD CONSTRAINT "research_participant_histories_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
