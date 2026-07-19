-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'SCOUT', 'ADMIN');

-- CreateEnum
CREATE TYPE "MissionCategory" AS ENUM ('STREET_CONDITIONS', 'VENUE_STATUS', 'LOCAL_EVENT', 'PRODUCT_AVAILABILITY', 'CROWD_DENSITY', 'WEATHER_ON_SITE', 'PHOTO_VERIFICATION', 'GENERAL_OBSERVATION');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('DRAFT', 'OPEN', 'MATCHED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MissionUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScoutAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "availability" "ScoutAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "completedMissions" INTEGER NOT NULL DEFAULT 0,
    "categories" "MissionCategory"[],
    "tags" TEXT[],
    "homeLocationId" UUID NOT NULL,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "maxRadiusMeters" INTEGER NOT NULL DEFAULT 5000,
    "languages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scout_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "MissionCategory" NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'DRAFT',
    "urgency" "MissionUrgency" NOT NULL DEFAULT 'NORMAL',
    "budgetCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "locationId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 1500,
    "requesterId" UUID NOT NULL,
    "assignedScoutId" UUID,
    "requiredTags" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_submissions" (
    "id" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "scoutId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "observedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "scout_profiles_userId_key" ON "scout_profiles"("userId");

-- CreateIndex
CREATE INDEX "missions_status_expiresAt_idx" ON "missions"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "missions_locationId_idx" ON "missions"("locationId");

-- CreateIndex
CREATE INDEX "missions_requesterId_idx" ON "missions"("requesterId");

-- CreateIndex
CREATE INDEX "missions_assignedScoutId_idx" ON "missions"("assignedScoutId");

-- CreateIndex
CREATE INDEX "mission_submissions_missionId_idx" ON "mission_submissions"("missionId");

-- CreateIndex
CREATE INDEX "mission_submissions_scoutId_idx" ON "mission_submissions"("scoutId");

-- CreateIndex
CREATE INDEX "mission_submissions_userId_idx" ON "mission_submissions"("userId");

-- AddForeignKey
ALTER TABLE "scout_profiles" ADD CONSTRAINT "scout_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_profiles" ADD CONSTRAINT "scout_profiles_homeLocationId_fkey" FOREIGN KEY ("homeLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_assignedScoutId_fkey" FOREIGN KEY ("assignedScoutId") REFERENCES "scout_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "scout_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
