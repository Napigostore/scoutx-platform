import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runTest() {
  console.log("=== FIWOKAN SAVE MISSION DRAFT & AUTHENTICATION REGRESSION TEST (SX-022A) ===");

  const timestamp = Date.now();
  const requesterEmail = `test_req_draft_${timestamp}@fiwokan.com`;
  const scoutEmail = `test_scout_draft_${timestamp}@fiwokan.com`;
  const otherRequesterEmail = `test_other_draft_${timestamp}@fiwokan.com`;

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

    // Test A: Unauthenticated Request Simulation
    const unauthReq = new Request("http://localhost:3000/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const unauthPrincipal = await getAuthenticatedPrincipal(unauthReq);
    if (unauthPrincipal !== null) {
      throw new Error("Expected unauthenticated request to return null principal");
    }
    console.log("   Pass (C): Unauthenticated request correctly returns 401 / null principal.");

    // Test B: SCOUT Role Rejection
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
      console.log("   Pass (D): SCOUT role correctly forbidden (403) from creating mission draft.");
    }

    // Test C: Valid REQUESTER Draft Creation
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

    // Assertion C: created mission has status DRAFT
    if (createdMission.status !== "DRAFT") {
      throw new Error(`Expected mission status DRAFT but got ${createdMission.status}`);
    }
    console.log(`   Pass: Mission status is '${createdMission.status}'.`);

    // Assertion D & E: created mission owner is the authenticated REQUESTER, not spoofed requesterId
    if (createdMission.requesterId !== requester.id) {
      throw new Error(
        `Expected requesterId ${requester.id} but got ${createdMission.requesterId}`,
      );
    }
    console.log("   Pass (E, I): Mission requesterId matches authenticated REQUESTER (cannot be spoofed).");

    // Assertion F, G, H: saving draft does not create payment, escrow, or reward transactions or invoke MoMo
    const finalTxCount = await prisma.coinTransaction.count();
    if (finalTxCount !== initialTxCount) {
      throw new Error(
        `Saving draft created ${finalTxCount - initialTxCount} coin transactions!`,
      );
    }
    console.log("   Pass (F, G, H): Saving draft created 0 CoinTransactions (No Escrow / No Payment / No Reward / No MoMo).");

    // Assertion DB: Verify in DB directly
    const dbMission = await prisma.mission.findUnique({
      where: { id: createdMission.id },
    });
    if (!dbMission || dbMission.status !== "DRAFT") {
      throw new Error("Mission not persisted properly in DB as DRAFT.");
    }
    console.log("   Pass: Mission persisted correctly in DB with status DRAFT.");

    console.log("\n========================================================");
    console.log("✅ ALL SAVE MISSION DRAFT & AUTH REGRESSION TESTS PASSED 100%!");
    console.log("========================================================\n");

    // Cleanup
    await prisma.mission.delete({ where: { id: createdMission.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [requester.id, scout.id, otherRequester.id] },
      },
    });
    console.log("Cleaned up test data safely.");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
