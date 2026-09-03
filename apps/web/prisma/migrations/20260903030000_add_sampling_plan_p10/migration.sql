-- CreateTable
CREATE TABLE "sampling_plans" (
    "id" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'STRICT',
    "variables" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sampling_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sampling_quotas" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "criteria" JSONB NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "reservedCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "isFull" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sampling_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sampling_plans_missionId_key" ON "sampling_plans"("missionId");

-- CreateIndex
CREATE INDEX "sampling_quotas_planId_idx" ON "sampling_quotas"("planId");

-- CreateIndex
CREATE INDEX "sampling_quotas_isFull_idx" ON "sampling_quotas"("isFull");

-- AlterTable
ALTER TABLE "SurveyParticipant" ADD COLUMN "samplingQuotaId" UUID;

-- AddForeignKey
ALTER TABLE "sampling_plans" ADD CONSTRAINT "sampling_plans_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_quotas" ADD CONSTRAINT "sampling_quotas_planId_fkey" FOREIGN KEY ("planId") REFERENCES "sampling_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyParticipant" ADD CONSTRAINT "SurveyParticipant_samplingQuotaId_fkey" FOREIGN KEY ("samplingQuotaId") REFERENCES "sampling_quotas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
