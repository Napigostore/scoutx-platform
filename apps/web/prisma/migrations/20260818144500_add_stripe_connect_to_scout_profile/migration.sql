-- AlterTable
ALTER TABLE "scout_profiles" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeConnectStatus" TEXT DEFAULT 'NOT_CONNECTED';
