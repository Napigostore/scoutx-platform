-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PHOTO', 'VIDEO', 'NOTE');

-- CreateEnum
CREATE TYPE "TrustAction" AS ENUM ('VERIFIED', 'DISPUTED', 'ENDORSED', 'BADGE_EARNED');

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "scoutId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "caption" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL DEFAULT 'PHOTO',
    "mediaUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_scores" (
    "userId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "trust_actions" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "action" "TrustAction" NOT NULL,
    "missionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" CHAR(4) NOT NULL DEFAULT 'COIN',
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "missionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_missionId_idx" ON "evidence"("missionId");

-- CreateIndex
CREATE INDEX "evidence_scoutId_idx" ON "evidence"("scoutId");

-- CreateIndex
CREATE INDEX "evidence_userId_idx" ON "evidence"("userId");

-- CreateIndex
CREATE INDEX "timeline_entries_missionId_idx" ON "timeline_entries"("missionId");

-- CreateIndex
CREATE INDEX "timeline_entries_createdAt_idx" ON "timeline_entries"("createdAt");

-- CreateIndex
CREATE INDEX "trust_actions_actorId_idx" ON "trust_actions"("actorId");

-- CreateIndex
CREATE INDEX "trust_actions_targetId_idx" ON "trust_actions"("targetId");

-- CreateIndex
CREATE INDEX "trust_actions_missionId_idx" ON "trust_actions"("missionId");

-- CreateIndex
CREATE INDEX "coin_transactions_userId_idx" ON "coin_transactions"("userId");

-- CreateIndex
CREATE INDEX "coin_transactions_missionId_idx" ON "coin_transactions"("missionId");

-- CreateIndex
CREATE INDEX "coin_transactions_createdAt_idx" ON "coin_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "scout_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_actions" ADD CONSTRAINT "trust_actions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_actions" ADD CONSTRAINT "trust_actions_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_actions" ADD CONSTRAINT "trust_actions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
