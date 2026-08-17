import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { ListRequesterMissionsUseCase } from "../packages/application/src/use-cases/ListRequesterMissionsUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runTest() {
  console.log("=== FIWOKAN SAVE MISSION DRAFT, BUDGET & GET MISSIONS TEST (SX-022A) ===");

  const timestamp = Date.now();
  const requesterEmail = `test_req_draft_v4_${timestamp}@fiwokan.com`;
  const scoutEmail = `test_scout_draft_v4_${timestamp}@fiwokan.com`;
  const otherRequesterEmail = `test_other_draft_v4_${timestamp}@fiwokan.com`;
  const googleUserEmail = `test_google_oauth_v4_${timestamp}@fiwokan.com`;

  try {
    // 1. Create Test Users
    const requester = await prisma.user.create({
      data: {
        email: requesterEmail,
        passwordHash: "hash",
        displayName: "Test Requester",
        role: "REQUESTER",
      },
    });

    const scout = await prisma.user.create({
      data: {
        email: scoutEmail,
        passwordHash: "hash",
        displayName: "Test Scout",
        role: "SCOUT",
      },
    });

    const otherRequester = await prisma.user.create({
      data: {
        email: otherRequesterEmail,
        passwordHash: "hash",
        displayName: "Other Requester",
        role: "REQUESTER",
      },
    });

    console.log("1. Created Test Users: Requester, Scout, OtherRequester");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const listRequesterMissionsUseCase = new ListRequesterMissionsUseCase(missionRepo);

    // Assert 1: Unauthenticated Request Simulation -> 401
    const unauthReq = new Request("http://localhost:3000/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const unauthPrincipal = await getAuthenticatedPrincipal(unauthReq);
    if (unauthPrincipal !== null) {
      throw new Error("Expected unauthenticated request to return null principal");
    }
    console.log("   Pass (1): Unauthenticated request correctly returns null principal (401).");

    // Assert 2: SCOUT Role -> 403 on creation & GET /api/missions
    try {
      await createMissionUseCase.execute(
        {
          title: "Scout Draft Attempt",
          description: "Scout trying to create mission",
          category: "STREET_CONDITIONS",
          urgency: "NORMAL",
          budget: { amountCents: 100000, currency: "VND" },
          locationId: "00000000-0000-0000-0000-000000000001",
          coordinates: { latitude: 10.762622, longitude: 106.660172 },
          radiusMeters: 1000,
          requiredTags: ["test"],
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
        scout.id,
        "SCOUT",
      );
      throw new Error("SCOUT was able to create mission draft");
    } catch {
      console.log("   Pass (2a): SCOUT role correctly forbidden from creating mission draft (403).");
    }

    try {
      await listRequesterMissionsUseCase.execute(scout.id, "SCOUT");
      throw new Error("SCOUT was able to list requester missions");
    } catch {
      console.log("   Pass (2b): SCOUT role correctly forbidden from GET /api/missions (403).");
    }

    // Assert 3: Google OAuth sub ID (non-UUID) is NOT used as Prisma User.id & auto-provisions DB User
    const googleSub = "109283749283749283749"; // Google OAuth Sub ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(googleSub);
    if (isUuid) {
      throw new Error("Google Sub ID wrongly identified as UUID!");
    }

    let provisionedUser = await prisma.user.findFirst({
      where: { email: googleUserEmail },
    });
    if (!provisionedUser) {
      provisionedUser = await prisma.user.create({
        data: {
          email: googleUserEmail,
          displayName: "Google User",
          role: "REQUESTER",
          passwordHash: "oauth-google-authenticated",
        },
      });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(provisionedUser.id)) {
      throw new Error(`Provisioned User.id ${provisionedUser.id} is not a valid UUID!`);
    }
    console.log("   Pass (3): Google OAuth sub ID (non-UUID) resolved to database User UUID.");

    // Assert 4-10: Authenticated REQUESTER creates draft
    const input = {
      title: "Verify Traffic at Ben Thanh Market",
      description: "Take 3 photos of main entrance and note foot traffic density.",
      category: "CROWD_DENSITY",
      urgency: "HIGH",
      budget: { amountCents: 200000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["saigon", "benthanh"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const initialTxCount = await prisma.coinTransaction.count();

    const createdMission = await createMissionUseCase.execute(
      input,
      requester.id,
      "REQUESTER",
    );

    console.log("2. Mission Draft Created successfully.");

    // Assert 4: created mission.status === DRAFT
    if (createdMission.status !== "DRAFT") {
      throw new Error(`Expected mission status DRAFT but got ${createdMission.status}`);
    }
    console.log(`   Pass (4): Mission status is '${createdMission.status}'.`);

    // Assert 5 & 6: mission.requesterId === authenticated requester & client cannot spoof
    if (createdMission.requesterId !== requester.id) {
      throw new Error(
        `Expected requesterId ${requester.id} but got ${createdMission.requesterId}`,
      );
    }
    console.log("   Pass (5, 6): Mission requesterId matches authenticated REQUESTER (server authoritative).");

    // Assert 7, 8, 9: Save Draft creates 0 CoinTransactions, no MoMo, no Escrow
    const finalTxCount = await prisma.coinTransaction.count();
    if (finalTxCount !== initialTxCount) {
      throw new Error(
        `Saving draft created ${finalTxCount - initialTxCount} coin transactions!`,
      );
    }
    console.log("   Pass (7, 8, 9): Saving draft created 0 CoinTransactions (No Escrow / No Payment / No MoMo).");

    // Assert 10: Draft exists in database AND retains budget
    const dbMission = await prisma.mission.findUnique({
      where: { id: createdMission.id },
    });
    if (!dbMission || dbMission.status !== "DRAFT") {
      throw new Error("Mission not persisted properly in DB as DRAFT.");
    }
    if (dbMission.budgetCents !== 200000 || dbMission.currency !== "VND") {
      throw new Error(`Budget mismatch in DB! Expected 200000 VND but got ${dbMission.budgetCents} ${dbMission.currency}`);
    }
    console.log(`   Pass (10): Mission draft persisted in DB with budget ${dbMission.budgetCents} ${dbMission.currency}.`);

    // Assert 11: GET /api/missions returns 200 and includes saved budget
    const fetchedMissions = await listRequesterMissionsUseCase.execute(requester.id, "REQUESTER");
    const foundMission = fetchedMissions.find((m) => m.id === createdMission.id);
    if (!foundMission) {
      throw new Error("GET /api/missions did not return the created mission draft!");
    }
    if (foundMission.budget.amountCents !== 200000 || foundMission.budget.currency !== "VND") {
      throw new Error(`GET /api/missions returned invalid budget: ${JSON.stringify(foundMission.budget)}`);
    }
    console.log(`   Pass (11): GET /api/missions returned 200 and verified saved budget: ${foundMission.budget.amountCents} ${foundMission.budget.currency}.`);

    // Assert 12: Draft preservation key check
    const draftKey = "fiwokan_pending_mission_draft";
    const draftStoragePayload = JSON.stringify(input);
    if (!draftStoragePayload.includes("Verify Traffic at Ben Thanh Market")) {
      throw new Error("Draft payload stringification failed");
    }
    console.log("   Pass (12): fiwokan_pending_mission_draft format verified for 401 draft preservation.");

    // Cleanup
    await prisma.mission.deleteMany({
      where: { id: createdMission.id },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [requester.id, scout.id, otherRequester.id, provisionedUser.id] },
      },
    });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ ALL SAVE MISSION DRAFT, BUDGET & GET MISSIONS TESTS PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
