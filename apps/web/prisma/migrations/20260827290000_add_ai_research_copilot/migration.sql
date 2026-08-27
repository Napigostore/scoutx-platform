-- CreateTable: research_briefs
CREATE TABLE IF NOT EXISTS "research_briefs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "market" TEXT,
    "methodology" TEXT,
    "targetSampleSize" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "budget" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "rawBrief" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: research_plans
CREATE TABLE IF NOT EXISTS "research_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "briefId" UUID NOT NULL,
    "audienceCriteria" JSONB NOT NULL,
    "screening" JSONB NOT NULL,
    "quota" JSONB NOT NULL,
    "survey" JSONB NOT NULL,
    "qualityPolicy" JSONB NOT NULL,
    "rewardPolicy" JSONB NOT NULL,
    "estimatedEligibleCount" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "warnings" JSONB,
    "aiModel" TEXT,
    "aiVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_plans_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "research_briefs_requesterId_idx" ON "research_briefs"("requesterId");
CREATE INDEX IF NOT EXISTS "research_briefs_status_idx" ON "research_briefs"("status");
CREATE INDEX IF NOT EXISTS "research_briefs_createdAt_idx" ON "research_briefs"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "research_plans_briefId_key" ON "research_plans"("briefId");
CREATE INDEX IF NOT EXISTS "research_plans_briefId_idx" ON "research_plans"("briefId");

-- ForeignKeys
ALTER TABLE "research_briefs" ADD CONSTRAINT "research_briefs_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_plans" ADD CONSTRAINT "research_plans_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "research_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
