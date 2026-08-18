import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { PublishMissionUseCase } from "../packages/application/src/use-cases/PublishMissionUseCase.js";
import { ListAvailableMissionsUseCase } from "../packages/application/src/use-cases/ListAvailableMissionsUseCase.js";

async function runLiveHomepageAndPublishTest() {
  console.log("=== FIWOKAN LIVE HOMEPAGE & PUBLISH DISCOVERY VERIFICATION ===");

  const timestamp = Date.now();
  const accountAEmail = `test_live_req_${timestamp}@fiwokan.com`;
  const accountBEmail = `test_live_scout_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Create Test Users: Account A (Requester) & Account B (Scout)
    const accountA = await prisma.user.create({
      data: {
        email: accountAEmail,
        passwordHash: "hash",
        displayName: "Account A Requester",
        role: "REQUESTER",
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

    console.log("1. Created Test Users: Account A Requester & Account B Scout.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const publishMissionUseCase = new PublishMissionUseCase(missionRepo);
    const listAvailableUseCase = new ListAvailableMissionsUseCase(missionRepo);

    // 2. Requester Account A creates DRAFT Mission
    const input = {
      title: `Live Homepage Test Mission ${timestamp}`,
      description: "Verify live homepage and scout discovery feed.",
      category: "PRODUCT_AVAILABILITY",
      urgency: "HIGH",
      budget: { amountCents: 600000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["live", "test"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, accountA.id, "REQUESTER");
    console.log(`2. Created DRAFT mission (ID: ${draftMission.id}, status: ${draftMission.status}).`);

    // 3. Publish Mission DRAFT -> OPEN
    const openMission = await publishMissionUseCase.execute(draftMission.id, accountA.id, "REQUESTER");
    if (openMission.status !== "OPEN") {
      throw new Error(`Expected OPEN status but got ${openMission.status}`);
    }
    console.log(`3. Published mission (ID: ${openMission.id}, status: ${openMission.status}).`);

    // 4. Verify Homepage DB Query returns the newly published OPEN mission
    const homepageMissions = await prisma.mission.findMany({
      where: {
        status: "OPEN",
        assignedScoutId: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const foundOnHomepage = homepageMissions.some(m => m.id === openMission.id);
    if (!foundOnHomepage) {
      throw new Error("Newly published mission not found in Homepage query result!");
    }
    console.log("   Pass (1): Homepage query successfully includes newly published OPEN mission.");

    // 5. Verify Scout B discovers the newly published OPEN mission
    const scoutBMissions = await listAvailableUseCase.execute("SCOUT", accountB.id);
    const foundByScoutB = scoutBMissions.some(m => m.id === openMission.id);
    if (!foundByScoutB) {
      throw new Error("Scout B failed to discover newly published OPEN mission!");
    }
    console.log("   Pass (2): Scout B successfully discovers published OPEN mission.");

    // 6. Verify Anti-Self-Dealing: Account A cannot discover their own mission in Scout feed
    const scoutAMissions = await listAvailableUseCase.execute("SCOUT", accountA.id);
    const foundByScoutA = scoutAMissions.some(m => m.id === openMission.id);
    if (foundByScoutA) {
      throw new Error("Account A wrongly discovered their own created mission in Scout feed!");
    }
    console.log("   Pass (3): Anti-Self-Dealing verified: Account A cannot see their own mission.");

    // Cleanup
    await prisma.mission.deleteMany({ where: { id: openMission.id } });
    await prisma.user.deleteMany({ where: { id: { in: [accountA.id, accountB.id] } } });
    console.log("Cleaned up test records safely.");

    console.log("\n========================================================");
    console.log("✅ LIVE HOMEPAGE & SCOUT DISCOVERY TEST PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLiveHomepageAndPublishTest();
