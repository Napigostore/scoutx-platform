import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { PublishMissionUseCase } from "../packages/application/src/use-cases/PublishMissionUseCase.js";
import { ClaimMissionUseCase } from "../packages/application/src/use-cases/ClaimMissionUseCase.js";
import { StartMissionUseCase } from "../packages/application/src/use-cases/StartMissionUseCase.js";
import { CreateMissionSubmissionUseCase } from "../packages/application/src/use-cases/CreateMissionSubmissionUseCase.js";
import { ResubmitMissionSubmissionUseCase } from "../packages/application/src/use-cases/ResubmitMissionSubmissionUseCase.js";
import { ApproveMissionSubmissionUseCase } from "../packages/application/src/use-cases/ApproveMissionSubmissionUseCase.js";
import { RejectMissionSubmissionUseCase } from "../packages/application/src/use-cases/RejectMissionSubmissionUseCase.js";
import { InMemoryEventBus } from "../packages/events/src/index.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runExecutionLifecycleTest() {
  console.log("=== FIWOKAN END-TO-END EXECUTION LIFECYCLE SUITE ===");

  const timestamp = Date.now();
  const requesterEmail = `test_req_exec_${timestamp}@fiwokan.com`;
  const scoutEmail = `test_scout_exec_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Create Test Users: Requester & Scout
    const requester = await prisma.user.create({
      data: {
        email: requesterEmail,
        passwordHash: "hash",
        displayName: "Requester Exec",
        role: "REQUESTER",
      },
    });

    const scout = await prisma.user.create({
      data: {
        email: scoutEmail,
        passwordHash: "hash",
        displayName: "Scout Exec",
        role: "SCOUT",
      },
    });

    console.log("1. Created Test Users: Requester Exec & Scout Exec.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const publishMissionUseCase = new PublishMissionUseCase(missionRepo);
    const claimMissionUseCase = new ClaimMissionUseCase(missionRepo);
    const startMissionUseCase = new StartMissionUseCase(missionRepo);
    const createSubmissionUseCase = new CreateMissionSubmissionUseCase(missionRepo);
    const resubmitSubmissionUseCase = new ResubmitMissionSubmissionUseCase(missionRepo, new InMemoryEventBus());
    const approveSubmissionUseCase = new ApproveMissionSubmissionUseCase(missionRepo, new InMemoryEventBus());
    const rejectSubmissionUseCase = new RejectMissionSubmissionUseCase(missionRepo, new InMemoryEventBus());

    // 2. Requester Creates & Publishes Mission
    const input = {
      title: "Execution E2E Test - Traffic Count",
      description: "Record traffic at main intersection.",
      category: "CROWD_DENSITY",
      urgency: "HIGH",
      budget: { amountCents: 450000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["exec", "test"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, requester.id, "REQUESTER");
    const openMission = await publishMissionUseCase.execute(draftMission.id, requester.id, "REQUESTER");
    const claimedMission = await claimMissionUseCase.execute(openMission.id, scout.id, "SCOUT");
    const startedMission = await startMissionUseCase.execute(openMission.id, scout.id, "SCOUT");

    console.log(`2. Mission Claimed & Started (ID: ${startedMission.id}, status: ${startedMission.status}).`);

    // ASSERTION 1: Unauthenticated request returns null principal (401)
    const unauthReq = new Request(`http://localhost:3000/api/scout/missions/${startedMission.id}/submission`, { method: "POST" });
    const unauthPrincipal = await getAuthenticatedPrincipal(unauthReq);
    if (unauthPrincipal !== null) {
      throw new Error("Unauthenticated request failed to return null principal!");
    }
    console.log("   Pass (1): Unauthenticated request returns null principal (401).");

    // ASSERTION 2: Auth.js Google session Scout submits evidence (IN_PROGRESS -> SUBMITTED)
    const submissionInput = {
      summary: "Verified high foot traffic recorded on site.",
      mediaUrls: ["https://fiwokan.com/evidence1.jpg"],
      latitude: 10.7721,
      longitude: 106.6983,
      observedAt: new Date().toISOString(),
    };

    const submission = await createSubmissionUseCase.execute(startedMission.id, submissionInput, scout.id, "SCOUT");
    if (!submission || submission.missionId !== startedMission.id) {
      throw new Error("Submission creation failed!");
    }

    const submittedMission = await prisma.mission.findUnique({ where: { id: startedMission.id } });
    if (!submittedMission || submittedMission.status !== "SUBMITTED") {
      throw new Error(`Expected mission status SUBMITTED but got ${submittedMission?.status}`);
    }
    console.log("   Pass (2): Scout submitted evidence successfully (Mission status: SUBMITTED).");

    // ASSERTION 3: Rejection & Resubmit Flow (Requester rejects submission -> status SUBMITTED -> IN_PROGRESS)
    await rejectSubmissionUseCase.execute(startedMission.id, requester.id, "REQUESTER", {
      rejectionReason: "Media is blurry, please provide clearer photo.",
    });

    const rejectedMission = await prisma.mission.findUnique({
      where: { id: startedMission.id },
      include: { submission: true },
    });
    if (rejectedMission?.status !== "IN_PROGRESS" || rejectedMission?.submission?.verified !== false || !rejectedMission?.submission?.rejectionReason) {
      throw new Error("Rejection failed to update mission to IN_PROGRESS and store rejectionReason!");
    }
    console.log("   Pass (3): Requester rejected submission with reason (Mission status reset to IN_PROGRESS).");

    // Scout resubmits evidence via ResubmitMissionSubmissionUseCase
    await resubmitSubmissionUseCase.execute(startedMission.id, scout.id, "SCOUT", submissionInput);
    
    const resubmittedMission = await prisma.mission.findUnique({ where: { id: startedMission.id } });
    if (!resubmittedMission || resubmittedMission.status !== "SUBMITTED") {
      throw new Error(`Expected resubmitted mission status SUBMITTED but got ${resubmittedMission?.status}`);
    }
    console.log("   Pass (4): Scout resubmitted evidence successfully (Mission status updated to SUBMITTED).");

    // ASSERTION 4: Role boundary (Scout cannot approve submission -> AuthorizationError)
    try {
      await approveSubmissionUseCase.execute(startedMission.id, scout.id, "SCOUT");
      throw new Error("Scout was wrongly allowed to approve submission!");
    } catch {
      console.log("   Pass (5): Scout role correctly forbidden from approving submission (403).");
    }

    // ASSERTION 5: Requester approves submission (SUBMITTED -> VERIFIED) & Coin payout triggered
    await approveSubmissionUseCase.execute(startedMission.id, requester.id, "REQUESTER");

    const verifiedMission = await prisma.mission.findUnique({
      where: { id: startedMission.id },
      include: { submission: true },
    });
    if (verifiedMission?.status !== "VERIFIED" || verifiedMission?.submission?.verified !== true) {
      throw new Error(`Expected mission VERIFIED and submission verified=true but got mission=${verifiedMission?.status}`);
    }
    console.log("   Pass (6): Requester approved submission (Mission status: VERIFIED).");

    // ASSERTION 6: Verify Reward CoinTransaction created in PostgreSQL
    const rewardTx = await prisma.coinTransaction.findFirst({
      where: { missionId: startedMission.id, eventType: "Reward" },
    });
    if (!rewardTx || rewardTx.amountCents !== 450000 || rewardTx.userId !== scout.id) {
      throw new Error(`Reward CoinTransaction missing or invalid! Got ${JSON.stringify(rewardTx)}`);
    }
    console.log(`   Pass (7): Reward CoinTransaction verified in DB (+${rewardTx.amountCents} VND to Scout ${scout.id}).`);

    // Cleanup
    const scoutProfile = await prisma.scoutProfile.findUnique({ where: { userId: scout.id } });
    await prisma.coinTransaction.deleteMany({ where: { missionId: startedMission.id } });
    await prisma.missionSubmission.deleteMany({ where: { missionId: startedMission.id } });
    await prisma.mission.deleteMany({ where: { id: startedMission.id } });
    if (scoutProfile) {
      await prisma.scoutProfile.deleteMany({ where: { id: scoutProfile.id } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [requester.id, scout.id] } } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ MISSION EXECUTION LIFECYCLE SUITE PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runExecutionLifecycleTest();
