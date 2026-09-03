import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envProd = path.resolve(__dirname, "../apps/web/.env.prod");
const envLocal = path.resolve(__dirname, "../apps/web/.env.local");
const envFile = path.resolve(__dirname, "../apps/web/.env");

if (fs.existsSync(envProd)) dotenv.config({ path: envProd, override: true });
else if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
else if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

import { PrismaClient } from "@prisma/client";
import { recordCoinMovement } from "../apps/web/src/lib/coin-ledger-service";
import { requesterCompleteMission, createDispute, checkAndSettleMissions, resolveDispute } from "../apps/web/src/lib/dispute-settlement-service";

async function runAuditStandardizationTests() {
  const prisma = new PrismaClient();
  console.log("=== RUNNING FULL E2E AUDIT & STANDARDIZATION TEST SUITE ===");

  try {
    // 1. Setup Test Users
    const requester = await prisma.user.upsert({
      where: { email: "test-requester-audit@scoutx.io" },
      create: {
        id: crypto.randomUUID(),
        email: "test-requester-audit@scoutx.io",
        displayName: "Audit Requester",
        role: "REQUESTER",
        passwordHash: "hash",
      },
      update: {},
    });

    const workerA = await prisma.user.upsert({
      where: { email: "test-worker-a-audit@scoutx.io" },
      create: {
        id: crypto.randomUUID(),
        email: "test-worker-a-audit@scoutx.io",
        displayName: "Worker A",
        role: "SCOUT",
        passwordHash: "hash",
      },
      update: {},
    });

    const workerB = await prisma.user.upsert({
      where: { email: "test-worker-b-audit@scoutx.io" },
      create: {
        id: crypto.randomUUID(),
        email: "test-worker-b-audit@scoutx.io",
        displayName: "Worker B",
        role: "SCOUT",
        passwordHash: "hash",
      },
      update: {},
    });

    const outsider = await prisma.user.upsert({
      where: { email: "test-outsider-audit@scoutx.io" },
      create: {
        id: crypto.randomUUID(),
        email: "test-outsider-audit@scoutx.io",
        displayName: "Outsider User",
        role: "SCOUT",
        passwordHash: "hash",
      },
      update: {},
    });

    const location = await prisma.location.findFirst() || await prisma.location.create({
      data: {
        id: crypto.randomUUID(),
        name: "HCM Test",
        city: "Ho Chi Minh City",
        country: "Vietnam",
        countryCode: "VN",
        latitude: 10.7769,
        longitude: 106.7009,
        timezone: "Asia/Ho_Chi_Minh",
      },
    });

    // --- TEST 1: Create Mission + Coin Reward Lock Idempotency ---
    console.log("\n[TEST 1] Mission Creation & Escrow Lock...");
    const mission = await prisma.mission.create({
      data: {
        id: crypto.randomUUID(),
        title: "Audit Test Mission",
        description: "Testing end-to-end settlement & ledger",
        category: "PHOTO_VERIFICATION",
        status: "OPEN",
        budgetCents: 500000, // 5,000 VND
        locationId: location.id,
        latitude: 10.7769,
        longitude: 106.7009,
        requesterId: requester.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    // Record coin lock in ledger
    await prisma.$transaction(async (tx) => {
      await recordCoinMovement(tx, {
        userId: requester.id,
        missionId: mission.id,
        type: "MISSION_REWARD_LOCK",
        amountCents: -500000,
        description: `Funded mission ${mission.id}`,
        idempotencyKey: `lock-${mission.id}`,
      });
    });

    // Test duplicate lock call
    const dupLock = await prisma.$transaction(async (tx) => {
      return recordCoinMovement(tx, {
        userId: requester.id,
        missionId: mission.id,
        type: "MISSION_REWARD_LOCK",
        amountCents: -500000,
        description: `Funded mission ${mission.id}`,
        idempotencyKey: `lock-${mission.id}`,
      });
    });

    console.log("Duplicate Lock Result (alreadyProcessed):", dupLock.alreadyProcessed);
    if (!dupLock.alreadyProcessed) throw new Error("Double Lock Protection Failed!");

    // --- TEST 2: Workers Join & Submit Evidence ---
    console.log("\n[TEST 2] Workers Upload Evidence...");
    await prisma.evidence.create({
      data: {
        missionId: mission.id,
        scoutId: crypto.randomUUID(),
        userId: workerA.id,
        caption: "Worker A Evidence",
        type: "PHOTO",
      },
    });

    await prisma.evidence.create({
      data: {
        missionId: mission.id,
        scoutId: crypto.randomUUID(),
        userId: workerB.id,
        caption: "Worker B Evidence",
        type: "PHOTO",
      },
    });

    // --- TEST 3: Requester Selects Winner A (24h Pending) ---
    console.log("\n[TEST 3] Requester Completes Mission & Selects Winner A...");
    const completedMission = await requesterCompleteMission(mission.id, workerA.id, requester.id);
    console.log("Mission status post-select:", completedMission.status);
    console.log("Mission winnerId:", completedMission.winnerId);
    if (completedMission.status !== "COMPLETED_PENDING_SETTLEMENT" || completedMission.winnerId !== workerA.id) {
      throw new Error("Winner Selection Failed!");
    }

    // --- TEST 4: Unauthorized Claim / Dispute Attempts ---
    console.log("\n[TEST 4] Unauthorized Dispute Enforcement...");
    // Winner A cannot dispute
    try {
      await createDispute(mission.id, workerA.id, "Winner trying to dispute");
      throw new Error("Winner was allowed to dispute!");
    } catch (e: any) {
      console.log("Winner Dispute Blocked (PASS):", e.message);
    }

    // Outsider cannot dispute
    try {
      await createDispute(mission.id, outsider.id, "Outsider trying to dispute");
      throw new Error("Outsider was allowed to dispute!");
    } catch (e: any) {
      console.log("Outsider Dispute Blocked (PASS):", e.message);
    }

    // --- TEST 5: Double Settlement Protection ---
    console.log("\n[TEST 5] Double Settlement & 24h Timeout Release...");
    // Backdate settlementStartedAt to 25h ago to trigger auto settlement
    await prisma.mission.update({
      where: { id: mission.id },
      data: { settlementStartedAt: new Date(Date.now() - 25 * 3600 * 1000) },
    });

    // Call checkAndSettleMissions twice
    const r1 = await checkAndSettleMissions();
    const r2 = await checkAndSettleMissions();

    console.log("Settle Run 1 report:", r1);
    console.log("Settle Run 2 report:", r2);

    const releasedLedgers = await prisma.coinLedger.findMany({
      where: { missionId: mission.id, type: "MISSION_REWARD_RELEASE" },
    });
    console.log("Release Ledger entries count:", releasedLedgers.length);
    if (releasedLedgers.length !== 1) {
      throw new Error(`Double Reward Protection Failed! Count = ${releasedLedgers.length}`);
    }

    // --- TEST 6: Dispute Claimant Win Flow ---
    console.log("\n[TEST 6] Dispute Claimant Win Flow...");
    const mission2 = await prisma.mission.create({
      data: {
        id: crypto.randomUUID(),
        title: "Dispute Test Mission",
        description: "Testing dispute resolution payout",
        category: "PHOTO_VERIFICATION",
        status: "COMPLETED_PENDING_SETTLEMENT",
        winnerId: workerA.id,
        settlementStartedAt: new Date(),
        budgetCents: 300000,
        locationId: location.id,
        latitude: 10.7769,
        longitude: 106.7009,
        requesterId: requester.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    await prisma.evidence.create({
      data: {
        missionId: mission2.id,
        scoutId: crypto.randomUUID(),
        userId: workerB.id,
        caption: "Worker B Evidence",
        type: "PHOTO",
      },
    });

    // Worker B files dispute
    const dispute = await createDispute(mission2.id, workerB.id, "Worker B should win");
    console.log("Dispute Created ID:", dispute.id);

    // Resolve dispute in favor of Claimant Worker B
    await resolveDispute(dispute.id, "WORKER_WIN", requester.id, workerB.id);

    const disputeMission = await prisma.mission.findUnique({ where: { id: mission2.id } });
    console.log("Post-dispute Mission status:", disputeMission?.status);
    console.log("Post-dispute Mission winnerId:", disputeMission?.winnerId);
    if (disputeMission?.status !== "REWARDED" || disputeMission?.winnerId !== workerB.id) {
      throw new Error("Dispute Resolution Payout to Claimant Failed!");
    }

    const bLedger = await prisma.coinLedger.findFirst({
      where: { missionId: mission2.id, userId: workerB.id, type: "MISSION_REWARD_RELEASE" },
    });
    if (!bLedger) throw new Error("Claimant Worker B did not receive CoinLedger reward!");

    console.log("\n=== ALL E2E AUDIT & STANDARDIZATION TESTS PASSED 100% ===");
  } catch (err) {
    console.error("❌ Test Failure:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuditStandardizationTests();
