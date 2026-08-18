import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { PublishMissionUseCase } from "../packages/application/src/use-cases/PublishMissionUseCase.js";
import { ClaimMissionUseCase } from "../packages/application/src/use-cases/ClaimMissionUseCase.js";
import { StartMissionUseCase } from "../packages/application/src/use-cases/StartMissionUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runScoutClaimStartTest() {
  console.log("=== FIWOKAN SCOUT MISSION CLAIM & START LIFECYCLE AUDIT ===");

  const timestamp = Date.now();
  const requesterEmail = `test_req_claim_${timestamp}@fiwokan.com`;
  const scoutEmail = `test_scout_claim_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Create Test Users
    const requester = await prisma.user.create({
      data: {
        email: requesterEmail,
        passwordHash: "hash",
        displayName: "Requester Owner",
        role: "REQUESTER",
      },
    });

    const scout = await prisma.user.create({
      data: {
        email: scoutEmail,
        passwordHash: "hash",
        displayName: "Beta Scout #1",
        role: "SCOUT",
      },
    });

    console.log("1. Created Test Users: Requester Owner & Beta Scout #1.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const publishMissionUseCase = new PublishMissionUseCase(missionRepo);
    const claimMissionUseCase = new ClaimMissionUseCase(missionRepo);
    const startMissionUseCase = new StartMissionUseCase(missionRepo);

    // 2. Requester Creates & Publishes Mission
    const input = {
      title: "Scout Claim E2E Audit - Entrance Photo",
      description: "Take entrance photos.",
      category: "CROWD_DENSITY",
      urgency: "HIGH",
      budget: { amountCents: 400000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["scout", "claim"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, requester.id, "REQUESTER");
    const openMission = await publishMissionUseCase.execute(draftMission.id, requester.id, "REQUESTER");
    console.log(`2. Mission Published with status: ${openMission.status}`);

    // 3. Test Anti-Self-Dealing Guard: Requester cannot claim their own mission
    try {
      await claimMissionUseCase.execute(openMission.id, requester.id, "SCOUT");
      throw new Error("Requester was wrongly allowed to claim their own mission!");
    } catch {
      console.log("   Pass (1): Anti-self-dealing guard correctly blocked requester from claiming own mission.");
    }

    // 4. Test Auth.js Scout Session Cookie Resolution
    const scoutSessionToken = await encode({
      token: {
        email: scoutEmail,
        sub: scout.id,
        role: "SCOUT",
      },
      secret,
      salt: "__Secure-authjs.session-token",
    });

    const scoutReq = new Request(`http://localhost:3000/api/scout/missions/${openMission.id}/claim`, {
      method: "POST",
      headers: {
        cookie: `__Secure-authjs.session-token=${scoutSessionToken}`,
      },
    });

    const scoutPrincipal = await getAuthenticatedPrincipal(scoutReq);
    if (!scoutPrincipal || scoutPrincipal.id !== scout.id) {
      throw new Error("Failed to resolve authenticated SCOUT principal!");
    }
    console.log("   Pass (2): Authenticated SCOUT principal resolved via Auth.js session cookie.");

    // 5. Scout Claims Mission (OPEN -> MATCHED)
    const claimedMission = await claimMissionUseCase.execute(openMission.id, scout.id, "SCOUT");
    const scoutProfile = await prisma.scoutProfile.findUnique({ where: { userId: scout.id } });
    console.log(`3. Mission Claimed by Scout: status=${claimedMission.status}, assignedScoutId=${claimedMission.assignedScoutId}`);

    if (claimedMission.status !== "MATCHED" || !claimedMission.assignedScoutId || claimedMission.assignedScoutId !== scoutProfile?.id) {
      throw new Error(`Mission claim failed to transition status to MATCHED or assign scout! Got assignedScoutId=${claimedMission.assignedScoutId}, expected ${scoutProfile?.id}`);
    }
    console.log("   Pass (3): Mission status updated from OPEN to MATCHED with assignedScoutId.");

    // 6. Scout Starts Mission (MATCHED -> IN_PROGRESS)
    const startedMission = await startMissionUseCase.execute(openMission.id, scout.id, "SCOUT");
    console.log(`4. Mission Started by Scout: status=${startedMission.status}`);

    if (startedMission.status !== "IN_PROGRESS") {
      throw new Error("Mission start failed to transition status to IN_PROGRESS!");
    }
    console.log("   Pass (4): Mission status updated from MATCHED to IN_PROGRESS.");

    // 7. Verify PostgreSQL DB record
    const dbMission = await prisma.mission.findUnique({ where: { id: openMission.id } });
    if (!dbMission || dbMission.status !== "IN_PROGRESS" || dbMission.assignedScoutId !== scoutProfile?.id) {
      throw new Error("PostgreSQL DB record status or assignedScoutId mismatch!");
    }
    console.log("   Pass (5): PostgreSQL DB record verified with status IN_PROGRESS and assignedScoutId.");

    // Cleanup
    await prisma.mission.deleteMany({ where: { id: openMission.id } });
    if (scoutProfile) {
      await prisma.scoutProfile.deleteMany({ where: { id: scoutProfile.id } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [requester.id, scout.id] } } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ SCOUT MISSION CLAIM & START LIFECYCLE TEST PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runScoutClaimStartTest();
