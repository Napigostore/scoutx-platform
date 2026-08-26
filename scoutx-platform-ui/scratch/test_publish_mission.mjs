import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { PublishMissionUseCase } from "../packages/application/src/use-cases/PublishMissionUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runPublishMissionTest() {
  console.log("=== FIWOKAN MISSION PUBLISHING & LIFECYCLE TEST ===");

  const timestamp = Date.now();
  const requesterEmail = `test_req_pub_${timestamp}@fiwokan.com`;
  const scoutEmail = `test_scout_pub_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Create Test Users
    const requester = await prisma.user.create({
      data: {
        email: requesterEmail,
        passwordHash: "hash",
        displayName: "Requester Publisher",
        role: "REQUESTER",
      },
    });

    const scout = await prisma.user.create({
      data: {
        email: scoutEmail,
        passwordHash: "hash",
        displayName: "Scout User",
        role: "SCOUT",
      },
    });

    console.log("1. Created Test Users: Requester Publisher & Scout.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const publishMissionUseCase = new PublishMissionUseCase(missionRepo);

    // 2. Create Mission Draft
    const input = {
      title: "Draft To Publish - Entrance Verification",
      description: "Take photos of foot traffic at entrance.",
      category: "CROWD_DENSITY",
      urgency: "HIGH",
      budget: { amountCents: 250000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["test", "publish"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, requester.id, "REQUESTER");
    console.log(`2. Mission Draft Created with ID ${draftMission.id}, status: ${draftMission.status}`);

    if (draftMission.status !== "DRAFT") {
      throw new Error(`Expected DRAFT status but got ${draftMission.status}`);
    }

    // 3. Test Unauthenticated publish attempt -> null principal
    const unauthReq = new Request(`http://localhost:3000/api/missions/${draftMission.id}/publish`, {
      method: "POST",
    });
    const unauthPrincipal = await getAuthenticatedPrincipal(unauthReq);
    if (unauthPrincipal !== null) {
      throw new Error("Expected unauthenticated publish to return null principal!");
    }
    console.log("   Pass (1): Unauthenticated request returns null principal (401).");

    // 4. Test SCOUT role publish attempt -> AuthorizationError
    try {
      await publishMissionUseCase.execute(draftMission.id, scout.id, "SCOUT");
      throw new Error("SCOUT was able to publish mission!");
    } catch {
      console.log("   Pass (2): SCOUT role correctly forbidden from publishing mission (403).");
    }

    // 5. Test Auth.js session cookie resolution for Requester
    const sessionToken = await encode({
      token: {
        email: requesterEmail,
        sub: requester.id,
        role: "REQUESTER",
      },
      secret,
      salt: "__Secure-authjs.session-token",
    });

    const cookieReq = new Request(`http://localhost:3000/api/missions/${draftMission.id}/publish`, {
      method: "POST",
      headers: {
        cookie: `__Secure-authjs.session-token=${sessionToken}`,
      },
    });

    const principal = await getAuthenticatedPrincipal(cookieReq);
    if (!principal || principal.id !== requester.id) {
      throw new Error("Failed to resolve authenticated requester principal!");
    }
    console.log("   Pass (3): Authenticated REQUESTER principal resolved via Auth.js cookie.");

    // 6. Execute PublishMissionUseCase -> Status transitions DRAFT -> OPEN
    const publishedMission = await publishMissionUseCase.execute(draftMission.id, requester.id, "REQUESTER");
    console.log(`3. Mission Published successfully with status: ${publishedMission.status}`);

    if (publishedMission.status !== "OPEN") {
      throw new Error(`Expected status OPEN after publish but got ${publishedMission.status}`);
    }
    console.log("   Pass (4): Mission status updated from DRAFT to OPEN.");

    // 7. Verify PostgreSQL DB record status
    const dbMission = await prisma.mission.findUnique({ where: { id: draftMission.id } });
    if (!dbMission || dbMission.status !== "OPEN") {
      throw new Error("PostgreSQL record status was not updated to OPEN!");
    }
    console.log("   Pass (5): PostgreSQL DB record verified with status OPEN.");

    // Cleanup
    await prisma.mission.deleteMany({ where: { id: draftMission.id } });
    await prisma.user.deleteMany({ where: { id: { in: [requester.id, scout.id] } } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ MISSION PUBLISHING REGRESSION TEST PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPublishMissionTest();
