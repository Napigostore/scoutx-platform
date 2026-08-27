-- AlterTable: Add country, gender, birthDate to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);

-- AlterTable: Add screeningEnabled, screeningQuestions, quotas to missions
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "screeningEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "screeningQuestions" JSONB;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "quotas" JSONB;

-- AlterTable: Add screening fields and profileSnapshot to survey_participants
ALTER TABLE "survey_participants" ADD COLUMN IF NOT EXISTS "screeningStatus" TEXT;
ALTER TABLE "survey_participants" ADD COLUMN IF NOT EXISTS "screeningAnswers" JSONB;
ALTER TABLE "survey_participants" ADD COLUMN IF NOT EXISTS "profileSnapshot" JSONB;
