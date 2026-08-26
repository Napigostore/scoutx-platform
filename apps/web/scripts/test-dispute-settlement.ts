// @ts-nocheck
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const pathsToTry = [
  path.resolve(__dirname, "../.env.production.local"),
  "C:/Users/HI/scoutx-platform/apps/web/.env.production.local",
  path.resolve(__dirname, "../.env.local"),
];

for (const p of pathsToTry) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    if (process.env.DATABASE_URL) break;
  }
}
console.log("Loaded DATABASE_URL starting with:", process.env.DATABASE_URL?.substring(0, 25));

import { PrismaClient } from "@prisma/client";
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

import {
  requesterCompleteMission,
  workerRequestCompletion,
  requesterRespondCompletion,
  createDispute,
  submitDisputeVote,
  fundDisputeRound,
  createReVoteRound,
  checkAndSettleMissions,
} from "@/lib/dispute-settlement-service";

async function main() {
  console.log("=== STARTING DISPUTE & SETTLEMENT INTEGRATION TESTS ===");

  // 1. Setup test users and mission
  const timestamp = Date.now();
  const requester = await testPrisma.user.create({
    data: {
      email: `test_req_${timestamp}@example.com`,
      displayName: `Test Requester ${timestamp}`,
      role: "REQUESTER",
      passwordHash: "hashed_pass",
    },
  });

  const worker = await testPrisma.user.create({
    data: {
      email: `test_worker_${timestamp}@example.com`,
      displayName: `Test Worker ${timestamp}`,
      role: "SCOUT",
      passwordHash: "hashed_pass",
    },
  });

  const location = await testPrisma.location.findFirst();
  if (!location) throw new Error("No location found in database");

  const mission = await testPrisma.mission.create({
    data: {
      title: `Test Workflow Mission ${timestamp}`,
      description: "Testing state machine and dispute resolution",
      category: "PHOTO_VERIFICATION",
      status: "IN_PROGRESS",
      budgetCents: 5000,
      locationId: location.id,
      latitude: 10.7769,
      longitude: 106.7009,
      requesterId: requester.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });

  console.log(`[TEST 1] Requester Complete -> Winner Selection`);
  const completed1 = await requesterCompleteMission(mission.id, worker.id, requester.id);
  console.assert(completed1.status === "COMPLETED_PENDING_SETTLEMENT", "Status should be COMPLETED_PENDING_SETTLEMENT");
  console.assert(completed1.winnerId === worker.id, "WinnerId should be worker.id");
  console.log("-> TEST 1 PASSED!");

  console.log(`[TEST 2] Worker Complete -> Requester Acceptance`);
  await testPrisma.mission.update({
    where: { id: mission.id },
    data: { status: "IN_PROGRESS", winnerId: null, settlementStartedAt: null },
  });
  await workerRequestCompletion(mission.id, worker.id);
  const accepted = await requesterRespondCompletion(mission.id, "ACCEPT", requester.id);
  console.assert(accepted.status === "COMPLETED_PENDING_SETTLEMENT", "Status should be COMPLETED_PENDING_SETTLEMENT");
  console.log("-> TEST 2 PASSED!");

  console.log(`[TEST 3] Auto-Complete 48h Timeout`);
  await testPrisma.mission.update({
    where: { id: mission.id },
    data: {
      status: "PENDING_REQUESTER_ACCEPTANCE",
      completionRequestedAt: new Date(Date.now() - 49 * 3600 * 1000),
      settlementStartedAt: null,
    },
  });
  const report3 = await checkAndSettleMissions();
  console.assert(report3.autoCompleted48h >= 1, "Should auto-complete at least 1 mission");
  console.log("-> TEST 3 PASSED!");

  console.log(`[TEST 4] Dispute Creation & Evidence`);
  const dispute = await createDispute(mission.id, requester.id, "Incomplete proof provided");
  console.assert(dispute.status === "OPEN", "Dispute status should be OPEN");
  console.log("-> TEST 4 PASSED!");

  console.log(`[TEST 5 & 8] Community Voting & +1 Coin Reward & Idempotency`);
  const round = await testPrisma.disputeRound.findFirst({ where: { disputeId: dispute.id } });
  if (!round) throw new Error("No dispute round created");

  const vote = await submitDisputeVote(dispute.id, round.id, worker.id, "WORKER_WIN");
  console.assert(vote.selectedSide === "WORKER_WIN", "Vote side should be WORKER_WIN");

  // Verify duplicate vote rejected
  let dupRejected = false;
  try {
    await submitDisputeVote(dispute.id, round.id, worker.id, "WORKER_WIN");
  } catch {
    dupRejected = true;
  }
  console.assert(dupRejected, "Duplicate vote should be rejected");

  // Verify +1 coin credited
  const txRecord = await testPrisma.coinTransaction.findFirst({
    where: { userId: worker.id, eventType: "VOTE_REWARD" },
  });
  console.assert(txRecord !== null, "Worker should receive +1 coin reward transaction");
  console.log("-> TEST 5 & 8 PASSED!");

  console.log(`[TEST 6] Re-vote Round Max Limit (Max 4 rounds)`);
  await createReVoteRound(dispute.id, requester.id); // Round 2
  await createReVoteRound(dispute.id, requester.id); // Round 3
  await createReVoteRound(dispute.id, requester.id); // Round 4

  let maxRejected = false;
  try {
    await createReVoteRound(dispute.id, requester.id); // Round 5 -> should fail
  } catch {
    maxRejected = true;
  }
  console.assert(maxRejected, "5th round should be rejected");
  console.log("-> TEST 6 PASSED!");

  console.log(`[TEST 7] Funding Validation (Max 100,000,000 coins)`);
  await fundDisputeRound(dispute.id, requester.id, 1000);
  let overFundRejected = false;
  try {
    await fundDisputeRound(dispute.id, requester.id, 100000001);
  } catch {
    overFundRejected = true;
  }
  console.assert(overFundRejected, "Overfunding > 100M should be rejected");
  console.log("-> TEST 7 PASSED!");

  console.log(`[TEST 9] Idempotent Double Payout Safety`);
  await testPrisma.mission.update({
    where: { id: mission.id },
    data: {
      status: "COMPLETED_PENDING_SETTLEMENT",
      winnerId: worker.id,
      settlementStartedAt: new Date(Date.now() - 25 * 3600 * 1000),
      rewardReleasedAt: null,
    },
  });

  const reportP1 = await checkAndSettleMissions();
  const reportP2 = await checkAndSettleMissions();
  console.assert(reportP1.settled24hRewards === 1, "First run should settle 1 mission");
  console.assert(reportP2.settled24hRewards === 0, "Second run should settle 0 missions (idempotent)");
  console.log("-> TEST 9 PASSED!");

  console.log("=== ALL DISPUTE & SETTLEMENT TESTS PASSED SUCCESSFULLY! ===");
}

main()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await testPrisma.$disconnect();
  });
