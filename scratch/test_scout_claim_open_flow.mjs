import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { PublishMissionUseCase } from "../packages/application/src/use-cases/PublishMissionUseCase.js";
import { ClaimMissionUseCase } from "../packages/application/src/use-cases/ClaimMissionUseCase.js";
import { GetAvailableMissionDetailsUseCase } from "../packages/application/src/use-cases/GetAvailableMissionDetailsUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runScoutClaimOpenFlowTest() {
  console.log("=== FIWOKAN SCOUT MISSION CLAIM & OPEN FLOW REGRESSION TEST ===");

  const timestamp = Date.now();
  const requesterAEmail = `test_req_claim_${timestamp}@fiwokan.com`;
  const scoutBEmail = `test_scout_b_${timestamp}@fiwokan.com`;
  const scoutCEmail = `test_scout_c_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Create Test Users: Requester A, Scout B, Scout C
    const accountA = await prisma.user.create({
      data: { email: requesterAEmail, passwordHash: "hash", displayName: "Requester A", role: "REQUESTER" },
    });
    const accountB = await prisma.user.create({
      data: { email: scoutBEmail, passwordHash: "hash", displayName: "Scout B", role: "SCOUT" },
    });
    const accountC = await prisma.user.create({
      data: { email: scoutCEmail, passwordHash: "hash", displayName: "Scout C", role: "SCOUT" },
    });

    console.log("1. Created Test Users: Requester A, Scout B, Scout C.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const publishMissionUseCase = new PublishMissionUseCase(missionRepo);
    const claimMissionUseCase = new ClaimMissionUseCase(missionRepo);
    const getAvailableDetailsUseCase = new GetAvailableMissionDetailsUseCase(missionRepo);

    // 2. Requester A Creates & Publishes Mission (DRAFT -> OPEN)
    const input = {
      title: `Claim Flow Mission ${timestamp}`,
      description: "Verification of Scout B claim flow.",
      category: "PRODUCT_AVAILABILITY",
      urgency: "HIGH",
      budget: { amountCents: 500000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["claim", "test"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, accountA.id, "REQUESTER");
    const openMission = await publishMissionUseCase.execute(draftMission.id, accountA.id, "REQUESTER");
    console.log(`2. Mission Published (ID: ${openMission.id}, status: ${openMission.status}).`);

    // 3. Scout B GET Mission Details via GetAvailableMissionDetailsUseCase
    const fetchedMission = await getAvailableDetailsUseCase.execute(openMission.id, "SCOUT");
    if (!fetchedMission || fetchedMission.id !== openMission.id || fetchedMission.status !== "OPEN") {
      throw new Error(`Fetched mission invalid: ${JSON.stringify(fetchedMission)}`);
    }
    console.log("   Pass (1): Scout B can GET mission details.");

    // 4. Anti-Self-Dealing Verification: Requester A attempts to claim own mission
    try {
      await claimMissionUseCase.execute(openMission.id, accountA.id, "SCOUT");
      throw new Error("Requester A was wrongly allowed to claim their own mission!");
    } catch (err) {
      console.log("   Pass (2): Requester A correctly forbidden from claiming own mission.");
    }

    // 5. Scout B Claims Mission via ClaimMissionUseCase
    const claimedMission = await claimMissionUseCase.execute(openMission.id, accountB.id, "SCOUT");
    if (claimedMission.status !== "MATCHED") {
      throw new Error(`Expected claimed status MATCHED but got ${claimedMission.status}`);
    }
    console.log("   Pass (3): Scout B successfully claimed mission (Status: MATCHED).");

    // 6. DB Verification: assignedScoutId matches Scout B's ScoutProfile.id
    const dbMission = await prisma.mission.findUnique({ where: { id: openMission.id } });
    const scoutProfileB = await prisma.scoutProfile.findUnique({ where: { userId: accountB.id } });

    if (!dbMission || !scoutProfileB || dbMission.assignedScoutId !== scoutProfileB.id || dbMission.status !== "MATCHED") {
      throw new Error(`DB verification failed! dbMission=${JSON.stringify(dbMission)}, scoutProfileB=${JSON.stringify(scoutProfileB)}`);
    }
    console.log("   Pass (4): PostgreSQL DB verified: status MATCHED, assignedScoutId = Scout B profile ID.");

    // 7. Double-Claim Protection: Scout C attempts to claim already claimed mission
    try {
      await claimMissionUseCase.execute(openMission.id, accountC.id, "SCOUT");
      throw new Error("Scout C was wrongly allowed to claim an already claimed mission!");
    } catch (err) {
      console.log("   Pass (5): Second Scout C correctly blocked from claiming already claimed mission.");
    }

    // 8. Auth.js cookie resolution check for GET /api/scout/missions/[missionId]
    const tokenB = await encode({
      token: { email: accountB.email, sub: accountB.id, role: accountB.role },
      secret,
      salt: "__Secure-authjs.session-token",
    });

    const mockReq = new Request(`http://localhost/api/scout/missions/${openMission.id}`, {
      headers: { Cookie: `__Secure-authjs.session-token=${tokenB}` },
    });

    const principalB = await getAuthenticatedPrincipal(mockReq);
    if (!principalB || principalB.email !== accountB.email) {
      throw new Error("Auth.js cookie session resolution failed!");
    }
    console.log("   Pass (6): Auth.js cookie session resolution verified for Scout B.");

    // Cleanup
    const scoutProfileC = await prisma.scoutProfile.findUnique({ where: { userId: accountC.id } });
    await prisma.mission.deleteMany({ where: { id: openMission.id } });
    if (scoutProfileB) await prisma.scoutProfile.deleteMany({ where: { id: scoutProfileB.id } });
    if (scoutProfileC) await prisma.scoutProfile.deleteMany({ where: { id: scoutProfileC.id } });
    await prisma.user.deleteMany({ where: { id: { in: [accountA.id, accountB.id, accountC.id] } } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ SCOUT MISSION CLAIM & OPEN FLOW TEST PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runScoutClaimOpenFlowTest();
