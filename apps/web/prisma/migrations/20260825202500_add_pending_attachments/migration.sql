-- CreateTable
CREATE TABLE IF NOT EXISTS "pending_attachments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "pending_attachments_storageKey_key" ON "pending_attachments"("storageKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pending_attachments_userId_idx" ON "pending_attachments"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pending_attachments_consumed_createdAt_idx" ON "pending_attachments"("consumed", "createdAt");

-- AddForeignKey
ALTER TABLE "pending_attachments" DROP CONSTRAINT IF EXISTS "pending_attachments_userId_fkey";
ALTER TABLE "pending_attachments" ADD CONSTRAINT "pending_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

