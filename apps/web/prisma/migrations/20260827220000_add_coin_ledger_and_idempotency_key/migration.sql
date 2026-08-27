-- CreateTable: coin_ledgers
CREATE TABLE IF NOT EXISTS "coin_ledgers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "missionId" UUID,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(4) NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_ledgers_pkey" PRIMARY KEY ("id")
);

-- AlterTable: coin_transactions add idempotencyKey
ALTER TABLE "coin_transactions" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "coin_ledgers_idempotencyKey_key" ON "coin_ledgers"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "coin_ledgers_userId_idx" ON "coin_ledgers"("userId");
CREATE INDEX IF NOT EXISTS "coin_ledgers_missionId_idx" ON "coin_ledgers"("missionId");
CREATE INDEX IF NOT EXISTS "coin_ledgers_createdAt_idx" ON "coin_ledgers"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "coin_transactions_idempotencyKey_key" ON "coin_transactions"("idempotencyKey");

-- AddForeignKeys
ALTER TABLE "coin_ledgers" ADD CONSTRAINT "coin_ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coin_ledgers" ADD CONSTRAINT "coin_ledgers_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
