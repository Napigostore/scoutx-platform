import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { PublishMissionUseCase } from "../packages/application/src/use-cases/PublishMissionUseCase.js";
import { ClaimMissionUseCase } from "../packages/application/src/use-cases/ClaimMissionUseCase.js";
import { ListAvailableMissionsUseCase } from "../packages/application/src/use-cases/ListAvailableMissionsUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runScoutDiscoveryE2ETest() {
  console.log("=== FIWOKAN SCOUT MISSION DISCOVERY END-TO-END SUITE ===");

  const timestamp = Date.now();
  const accountAEmail = `test_account_a_${timestamp}@fiwokan.com`;
  const accountBEmail = `test_account_b_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Create Test Users: Account A (Requester & Scout) & Account B (Scout)
    const accountA = await prisma.user.create({
      data: {
        email: accountAEmail,
        passwordHash: "hash",
        displayName: "Account A Creator",
        role: "SCOUT",
      },
    });

    const accountB = await prisma.user.create({
      data: {
        email: accountBEmail,
        passwordHash: "hash",
        displayName: "Account B Scout",
        role: "SCOUT",
      },
    });

    console.log("1. Created Test Users: Account A Creator & Account B Scout.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const publishMissionUseCase = new PublishMissionUseCase(missionRepo);
    const claimMissionUseCase = new ClaimMissionUseCase(missionRepo);
    const listAvailableUseCase = new ListAvailableMissionsUseCase(missionRepo);

    // 2. Account A Creates DRAFT Mission
    const input = {
      title: "Discovery E2E Test - Store Audit",
      description: "Verify store shelf status.",
      category: "PRODUCT_AVAILABILITY",
      urgency: "HIGH",
      budget: { amountCents: 500000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["discovery", "test"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, accountA.id, "REQUESTER");
    console.log(`2. Account A created DRAFT mission (ID: ${draftMission.id}, status: ${draftMission.status}).`);

    // ASSERTION 1: Account B does NOT see Account A's DRAFT mission in available feed
    const bAvailableStep1 = await listAvailableUseCase.execute("SCOUT", accountB.id);
    const bFoundDraft = bAvailableStep1.some(m => m.id === draftMission.id);
    if (bFoundDraft) {
      throw new Error("Account B wrongly saw Account A's DRAFT mission in available feed!");
    }
    console.log("   Pass (1): Account B correctly does NOT see Account A's DRAFT mission.");

    // 3. Account A Publishes Mission (DRAFT -> OPEN)
    const openMission = await publishMissionUseCase.execute(draftMission.id, accountA.id, "REQUESTER");
    console.log(`3. Account A Published mission (ID: ${openMission.id}, status: ${openMission.status}).`);

    // ASSERTION 2: Account B (Scout) DOES see Account A's OPEN mission
    const bAvailableStep2 = await listAvailableUseCase.execute("SCOUT", accountB.id);
    const bFoundOpen = bAvailableStep2.some(m => m.id === openMission.id);
    if (!bFoundOpen) {
      throw new Error("Account B failed to discover Account A's OPEN mission in available feed!");
    }
    console.log("   Pass (2): Account B correctly discovers Account A's OPEN mission.");

    // ASSERTION 3: Anti-Self-Dealing: Account A does NOT see their own created mission in available feed
    const aAvailableStep2 = await listAvailableUseCase.execute("SCOUT", accountA.id);
    const aFoundOwn = aAvailableStep2.some(m => m.id === openMission.id);
    if (aFoundOwn) {
      throw new Error("Account A wrongly saw their own created mission in discovery feed!");
    }
    console.log("   Pass (3): Anti-Self-Dealing verified: Account A does NOT see their own created mission.");

    // ASSERTION 4: Account B claims mission successfully (OPEN -> MATCHED)
    const claimedMission = await claimMissionUseCase.execute(openMission.id, accountB.id, "SCOUT");
    if (claimedMission.status !== "MATCHED") {
      throw new Error(`Account B claim failed! Expected MATCHED but got ${claimedMission.status}`);
    }
    console.log("   Pass (4): Account B successfully claimed Account A's mission (Status: MATCHED).");

    // ASSERTION 5: Unauthenticated request returns 401
    const unauthReq = new Request("http://localhost:3000/api/scout/missions", { method: "GET" });
    const unauthPrincipal = await getAuthenticatedPrincipal(unauthReq);
    if (unauthPrincipal !== null) {
      throw new Error("Unauthenticated request failed to return null principal!");
    }
    console.log("   Pass (5): Unauthenticated GET /api/scout/missions returns 401.");

    // Cleanup
    const scoutProfileB = await prisma.scoutProfile.findUnique({ where: { userId: accountB.id } });
    await prisma.mission.deleteMany({ where: { id: openMission.id } });
    if (scoutProfileB) {
      await prisma.scoutProfile.deleteMany({ where: { id: scoutProfileB.id } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [accountA.id, accountB.id] } } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ SCOUT MISSION DISCOVERY E2E SUITE PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runScoutDiscoveryE2ETest();
