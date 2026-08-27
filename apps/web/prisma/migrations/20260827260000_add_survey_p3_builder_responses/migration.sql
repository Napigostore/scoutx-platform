-- CreateTable: survey_questions
CREATE TABLE IF NOT EXISTS "survey_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB,
    "validation" JSONB,
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: survey_responses
CREATE TABLE IF NOT EXISTS "survey_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: survey_submissions
CREATE TABLE IF NOT EXISTS "survey_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "missionId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "completionCode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "qualityStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "survey_questions_missionId_order_idx" ON "survey_questions"("missionId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "survey_responses_missionId_participantId_questionId_key" ON "survey_responses"("missionId", "participantId", "questionId");
CREATE INDEX IF NOT EXISTS "survey_responses_missionId_idx" ON "survey_responses"("missionId");
CREATE INDEX IF NOT EXISTS "survey_responses_participantId_idx" ON "survey_responses"("participantId");
CREATE UNIQUE INDEX IF NOT EXISTS "survey_submissions_missionId_participantId_key" ON "survey_submissions"("missionId", "participantId");
CREATE INDEX IF NOT EXISTS "survey_submissions_missionId_completionCode_idx" ON "survey_submissions"("missionId", "completionCode");

-- AddForeignKeys
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "survey_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "survey_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
