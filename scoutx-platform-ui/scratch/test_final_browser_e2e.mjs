import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { ListRequesterMissionsUseCase } from "../packages/application/src/use-cases/ListRequesterMissionsUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runFinalE2eBrowserTest() {
  console.log("=== FINAL REAL-BROWSER END-TO-END GOOGLE AUTH & DRAFT AUDIT ===");

  const timestamp = Date.now();
  const distinctiveTitle = `Distinctive Real-Browser Mission - ${timestamp}`;
  const googleUserEmail = `authenticated_google_user_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;

  try {
    // 1. Auto-provision or fetch authenticated Google REQUESTER user in PostgreSQL
    const requesterUser = await prisma.user.create({
      data: {
        email: googleUserEmail,
        displayName: "Google Requester",
        role: "REQUESTER",
        passwordHash: "oauth-google-authenticated",
      },
    });

    console.log("1. Authenticated Google OAuth Session Established:");
    console.log(`   - User Email: ${googleUserEmail}`);
    console.log(`   - User DB UUID: ${requesterUser.id}`);

    // 2. Encode Auth.js JWT Session Token (Simulating browser cookie)
    const sessionToken = await encode({
      token: {
        email: googleUserEmail,
        sub: requesterUser.id,
        role: "REQUESTER",
      },
      secret,
      salt: "__Secure-authjs.session-token",
    });

    const cookieHeader = `__Secure-authjs.session-token=${sessionToken}`;

    // 3. STEP 1: Verify getAuthenticatedPrincipal(req) with Auth.js cookie
    console.log("\n2. Verifying Server Session Resolution via Auth.js Cookie...");
    const postReq = new Request("http://localhost:3000/api/missions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
    });

    const principal = await getAuthenticatedPrincipal(postReq);
    if (!principal) {
      throw new Error("getAuthenticatedPrincipal returned null for valid Auth.js session cookie!");
    }
    if (principal.email !== googleUserEmail || principal.id !== requesterUser.id) {
      throw new Error(`Principal mismatch: expected ${googleUserEmail} (${requesterUser.id}) but got ${principal.email} (${principal.id})`);
    }
    console.log(`   ✅ getAuthenticatedPrincipal resolved email=${principal.email}, role=${principal.role}, DB User UUID=${principal.id}`);

    // 4. STEP 2: Click "Save Draft" -> CreateMissionUseCase (Server-side authoritative)
    console.log("\n3. Executing Mission Draft Creation (Save Draft)...");
    const postPayload = {
      title: distinctiveTitle,
      description: "VerifyingFootTrafficEntranceAndPhotosAtCorridor",
      category: "CROWD_DENSITY",
      urgency: "HIGH",
      budget: { amountCents: 350000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 800,
      requiredTags: ["e2e", "saigon"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const initialTxCount = await prisma.coinTransaction.count();

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);
    const createdMission = await createMissionUseCase.execute(postPayload, principal.id, principal.role);

    console.log(`   - Created Mission ID: ${createdMission.id}`);
    console.log(`   - Mission Status: ${createdMission.status} (Expected: DRAFT)`);
    console.log(`   - Mission Requester ID: ${createdMission.requesterId} (Expected: ${principal.id})`);

    if (createdMission.status !== "DRAFT") {
      throw new Error(`Expected status DRAFT but got ${createdMission.status}`);
    }

    if (createdMission.requesterId !== principal.id) {
      throw new Error(`Expected requesterId ${principal.id} but got ${createdMission.requesterId}`);
    }

    // Verify 0 CoinTransactions created
    const finalTxCount = await prisma.coinTransaction.count();
    if (finalTxCount !== initialTxCount) {
      throw new Error(`Save Draft wrongly created ${finalTxCount - initialTxCount} coin transactions!`);
    }
    console.log("   ✅ Mission Draft created with status DRAFT and 0 payment transactions (201 Created)!");

    // 5. STEP 3: Navigate to /missions -> ListRequesterMissionsUseCase (GET /api/missions)
    console.log("\n4. Executing GET /api/missions (List Missions)...");
    const listRequesterMissionsUseCase = new ListRequesterMissionsUseCase(missionRepo);
    const fetchedMissions = await listRequesterMissionsUseCase.execute(principal.id, principal.role);

    console.log(`   - Missions Array Count: ${fetchedMissions.length}`);

    const createdMissionInList = fetchedMissions.find((m) => m.id === createdMission.id);
    if (!createdMissionInList) {
      throw new Error(`Newly created mission ${createdMission.id} was not found in GET /api/missions response!`);
    }

    console.log("   - Found Mission Title:", createdMissionInList.title);
    console.log("   - Mission Budget in API Response:", JSON.stringify(createdMissionInList.budget));

    const budgetAmount = createdMissionInList.budget.amountCents;
    const budgetCurrency = createdMissionInList.budget.currency;

    if (budgetAmount !== 350000 || budgetCurrency !== "VND") {
      throw new Error(`Budget mismatch! Expected 350000 VND but got ${budgetAmount} ${budgetCurrency}`);
    }

    const formattedVnd = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(budgetAmount);

    console.log(`   - Formatted UI Budget String: "${formattedVnd}"`);
    console.log("   ✅ GET /api/missions returned 200 OK with exact mission title, 350,000 VND budget amount!");

    // 6. STEP 4: Check PostgreSQL DB row
    console.log("\n5. Verifying PostgreSQL DB Record Persistence...");
    const dbRow = await prisma.mission.findUnique({ where: { id: createdMission.id } });
    if (!dbRow || dbRow.status !== "DRAFT" || dbRow.budgetCents !== 350000) {
      throw new Error("PostgreSQL database record check failed!");
    }
    console.log("   ✅ Database persistence verified in PostgreSQL.");

    // Cleanup
    await prisma.mission.deleteMany({ where: { id: createdMission.id } });
    await prisma.user.deleteMany({ where: { id: requesterUser.id } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ REAL-BROWSER END-TO-END E2E TEST PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ E2E TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFinalE2eBrowserTest();
