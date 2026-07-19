import { PrismaClient } from "@prisma/client";
import { SimplePasswordHasher } from "../../../packages/auth/src/identity/PasswordHasher";

const prisma = new PrismaClient();
const hasher = new SimplePasswordHasher();

async function main() {
  console.log("Starting database seeding...");

  // 1. Create a default Location
  const location = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Tokyo Shibuya",
      city: "Tokyo",
      country: "Japan",
      countryCode: "JP",
      latitude: 35.658034,
      longitude: 139.701636,
      timezone: "Asia/Tokyo",
    },
  });
  console.log("Seeded Location:", location.name);

  // 2. Create a Demo Requester User
  const requesterEmail = "demo@scoutx.local";
  const requesterPasswordHash = await hasher.hash("demo123");

  const requester = await prisma.user.upsert({
    where: { email: requesterEmail },
    update: {
      passwordHash: requesterPasswordHash,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      email: requesterEmail,
      displayName: "Demo Requester",
      role: "REQUESTER",
      passwordHash: requesterPasswordHash,
      reliabilityScore: 80,
    },
  });
  console.log("Seeded Requester User:", requester.email);

  // 3. Create a Demo Scout User
  const scoutEmail = "scout@scoutx.local";
  const scoutPasswordHash = await hasher.hash("scout123");

  const scout = await prisma.user.upsert({
    where: { email: scoutEmail },
    update: {
      passwordHash: scoutPasswordHash,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      email: scoutEmail,
      displayName: "Demo Scout",
      role: "SCOUT",
      passwordHash: scoutPasswordHash,
      reliabilityScore: 90,
    },
  });
  console.log("Seeded Scout User:", scout.email);

  // 4. Create Scout Profile
  const scoutProfile = await prisma.scoutProfile.upsert({
    where: { userId: scout.id },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      userId: scout.id,
      displayName: "Demo Scout Profile",
      bio: "Experienced local scout in Tokyo Shibuya area.",
      availability: "AVAILABLE",
      reliabilityScore: 90,
      homeLocationId: location.id,
      maxRadiusMeters: 10000,
      languages: ["Japanese", "English"],
    },
  });
  console.log("Seeded Scout Profile:", scoutProfile.displayName);

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
