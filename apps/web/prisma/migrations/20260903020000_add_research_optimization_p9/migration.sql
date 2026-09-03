-- CreateTable
CREATE TABLE "optimization_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "projectedImpact" TEXT NOT NULL,
    "suggestedAction" JSONB NOT NULL,
    "isAutoExecutable" BOOLEAN NOT NULL DEFAULT false,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reasoning" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "optimization_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recommendationId" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "actionType" TEXT NOT NULL,
    "performedById" UUID,
    "oldState" JSONB,
    "newState" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "optimization_recommendations_idempotencyKey_key" ON "optimization_recommendations"("idempotencyKey");

-- CreateIndex
CREATE INDEX "optimization_recommendations_missionId_idx" ON "optimization_recommendations"("missionId");

-- CreateIndex
CREATE INDEX "optimization_recommendations_status_idx" ON "optimization_recommendations"("status");

-- CreateIndex
CREATE INDEX "optimization_events_recommendationId_idx" ON "optimization_events"("recommendationId");

-- CreateIndex
CREATE INDEX "optimization_events_missionId_idx" ON "optimization_events"("missionId");

-- AddForeignKey
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_events" ADD CONSTRAINT "optimization_events_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "optimization_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_events" ADD CONSTRAINT "optimization_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_events" ADD CONSTRAINT "optimization_events_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
