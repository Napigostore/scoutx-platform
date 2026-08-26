-- CreateTable
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "expertise" TEXT,
    "livingCity" TEXT DEFAULT 'Ho Chi Minh City',
    "missionCities" TEXT[] DEFAULT ARRAY['Ho Chi Minh City']::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredMissionTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "legalName" TEXT,
    "phone" TEXT,
    "privateNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_userId_key" ON "user_profiles"("userId");

-- AddForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_userId_fkey";
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
