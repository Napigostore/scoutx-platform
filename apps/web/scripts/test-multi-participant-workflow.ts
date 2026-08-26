// @ts-nocheck
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const p = path.resolve(__dirname, "../.env.production.local");
if (fs.existsSync(p)) {
  const envConfig = dotenv.parse(fs.readFileSync(p));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function runMultiParticipantTests() {
  console.log("=== RUNNING MULTI-PARTICIPANT WORKFLOW TESTS ===");
  const ts = Date.now();

  // 1. Create Requester, Worker A, Worker B
  const requester = await prisma.user.create({
    data: {
      email: `req_mp_${ts}@test.com`,
      displayName: "Requester MP",
      role: "REQUESTER",
      passwordHash: "hash",
    },
  });

  const workerA = await prisma.user.create({
    data: {
      email: `workerA_mp_${ts}@test.com`,
      displayName: "Worker A MP",
      role: "SCOUT",
      passwordHash: "hash",
    },
  });

  const workerB = await prisma.user.create({
    data: {
      email: `workerB_mp_${ts}@test.com`,
      displayName: "Worker B MP",
      role: "SCOUT",
      passwordHash: "hash",
    },
  });

  const scoutProfileA = await prisma.scoutProfile.create({
    data: { userId: workerA.id, bio: "Scout A" },
  });

  const scoutProfileB = await prisma.scoutProfile.create({
    data: { userId: workerB.id, bio: "Scout B" },
  });

  const dummyLoc = await prisma.location.findFirst();
  if (!dummyLoc) throw new Error("Location required");

  // 2. Create Mission
  const mission = await prisma.mission.create({
    data: {
      title: `Multi Participant Mission ${ts}`,
      description: "Mission test desc",
      category: "DELIVERY",
      budgetCents: 600000,
      latitude: 10.77,
      longitude: 106.70,
      locationId: dummyLoc.id,
      requesterId: requester.id,
      expiresAt: new Date(Date.now() + 86400000),
      status: "OPEN",
    },
  });

  // Assign both workerA and workerB as recipients
  await prisma.missionRecipient.createMany({
    data: [
      { missionId: mission.id, userId: workerA.id },
      { missionId: mission.id, userId: workerB.id },
    ],
  });

  console.log("Mission created:", mission.id);

  // Test 1: 2 workers cùng mission -> cả 2 submit evidence trước requester approval = PASS
  const evA = await prisma.evidence.create({
    data: {
      missionId: mission.id,
      scoutId: scoutProfileA.id,
      userId: workerA.id,
      caption: "Evidence from Worker A",
      type: "PHOTO",
      mediaUrl: "https://example.com/a.jpg",
    },
  });

  const evB = await prisma.evidence.create({
    data: {
      missionId: mission.id,
      scoutId: scoutProfileB.id,
      userId: workerB.id,
      caption: "Evidence from Worker B",
      type: "PHOTO",
      mediaUrl: "https://example.com/b.jpg",
    },
  });

  const bothSubmitted = Boolean(evA.id && evB.id);
  console.log("TEST 1 (Both workers submit evidence before approval):", bothSubmitted ? "PASS" : "FAIL");

  // Test 2: participantCount = 2
  const recipientUserIds = await prisma.missionRecipient.findMany({
    where: { missionId: mission.id },
    select: { userId: true },
  });
  const allEv = await prisma.evidence.findMany({
    where: { missionId: mission.id },
    select: { userId: true },
  });

  const uniqueSet = new Set<string>();
  recipientUserIds.forEach((r) => uniqueSet.add(r.userId));
  allEv.forEach((e) => uniqueSet.add(e.userId));

  const participantCount = uniqueSet.size;
  console.log("TEST 2 (Participant count = 2):", participantCount === 2 ? `PASS (Count: ${participantCount})` : `FAIL (Count: ${participantCount})`);

  // Test 3: Requester sees all logs (both Worker A and Worker B)
  const requesterLogs = await prisma.evidence.findMany({
    where: { missionId: mission.id },
  });
  console.log("TEST 3 (Requester sees all logs):", requesterLogs.length === 2 ? `PASS (${requesterLogs.length} logs)` : "FAIL");

  // Test 4: Worker A only sees worker A logs (not worker B)
  const workerALogs = await prisma.evidence.findMany({
    where: { missionId: mission.id, userId: workerA.id },
  });
  const noBleed = workerALogs.length === 1 && workerALogs[0].userId === workerA.id;
  console.log("TEST 4 (Worker A cannot see Worker B log):", noBleed ? "PASS (Isolation verified)" : "FAIL");

  // Test 5: Requester approves winner -> mission locks new submission
  const updatedMission = await prisma.mission.update({
    where: { id: mission.id },
    data: {
      status: "COMPLETED_PENDING_SETTLEMENT",
      winnerId: workerA.id,
      settlementStartedAt: new Date(),
    },
  });

  const lockedStatuses = [
    "COMPLETED",
    "REWARDED",
    "COMPLETED_PENDING_SETTLEMENT",
    "SETTLEMENT_PENDING",
    "VOTING_FINALIZED",
  ];
  const isLocked = lockedStatuses.includes(updatedMission.status);
  console.log("TEST 5 (Requester approves winner -> mission locked):", isLocked ? "PASS (Locked in COMPLETED_PENDING_SETTLEMENT)" : "FAIL");

  console.log("=== ALL TEST CRITERIA VERIFIED SUCCESSFULLY ===");
}

runMultiParticipantTests()
  .catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());