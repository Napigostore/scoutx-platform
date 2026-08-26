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

  // 5. Seed Trust Scores
  const requesterTrust = await prisma.trustScore.upsert({
    where: { userId: requester.id },
    update: {},
    create: {
      userId: requester.id,
      score: 80,
    },
  });
  console.log("Seeded Trust Score for Requester:", requesterTrust.score);

  const scoutTrust = await prisma.trustScore.upsert({
    where: { userId: scout.id },
    update: {},
    create: {
      userId: scout.id,
      score: 90,
    },
  });
  console.log("Seeded Trust Score for Scout:", scoutTrust.score);

  // 6. Seed Coin Transactions
  const coinTx1 = await prisma.coinTransaction.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      userId: scout.id,
      amountCents: 5000,
      currency: "COIN",
      reason: "reward",
      description: "Mission completion bonus (seed data)",
      eventType: "seed.data",
    },
  });
  console.log("Seeded Coin Transaction:", coinTx1.id);

  const coinTx2 = await prisma.coinTransaction.upsert({
    where: { id: "00000000-0000-0000-0000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      userId: scout.id,
      amountCents: 2500,
      currency: "COIN",
      reason: "reward",
      description: "Evidence bonus (seed data)",
      eventType: "evidence.verified",
    },
  });
  console.log("Seeded Coin Transaction:", coinTx2.id);

  // 6.5. Seed Sample Mission (referenced by evidence, timeline, and trust actions)
  const mission = await prisma.mission.upsert({
    where: { id: "44444444-4444-4444-8444-444444444401" },
    update: {},
    create: {
      id: "44444444-4444-4444-8444-444444444401",
      title: "Sample Shibuya Crossing Mission",
      description: "Verify pedestrian density at Shibuya scramble crossing.",
      category: "CROWD_DENSITY",
      status: "OPEN",
      urgency: "NORMAL",
      budgetCents: 5000,
      currency: "USD",
      locationId: location.id,
      latitude: 35.6595,
      longitude: 139.7005,
      radiusMeters: 1500,
      requesterId: requester.id,
      assignedScoutId: scoutProfile.id,
      requiredTags: ["shibuya", "photo"],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("Seeded Mission:", mission.id);

  // 7. Seed Evidence
  const evidence = await prisma.evidence.upsert({
    where: { id: "00000000-0000-0000-0000-000000000020" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      missionId: "44444444-4444-4444-8444-444444444401",
      scoutId: scoutProfile.id,
      userId: scout.id,
      caption: "Shibuya crossing pedestrian density (seed)",
      type: "PHOTO",
      location: "Shibuya Scramble",
      verified: false,
    },
  });
  console.log("Seeded Evidence:", evidence.id);

  // 8. Seed Timeline Entries
  const tlEntry = await prisma.timelineEntry.create({
    data: {
      id: "00000000-0000-0000-0000-000000000030",
      missionId: "44444444-4444-4444-8444-444444444401",
      eventType: "seed.data",
      summary: "Seed data: sample timeline entry for development",
      actorId: requester.id,
      metadata: { source: "seed", purpose: "development" },
    },
  });
  console.log("Seeded Timeline Entry:", tlEntry.id);

  // 9. Seed Trust Actions
  const trustAction = await prisma.trustActionRecord.create({
    data: {
      id: "00000000-0000-0000-0000-000000000040",
      actorId: requester.id,
      targetId: scout.id,
      action: "ENDORSED",
      missionId: "44444444-4444-4444-8444-444444444401",
    },
  });
  console.log("Seeded Trust Action:", trustAction.id);

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
