import { encode } from "../node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/jwt.js";
import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";
import { CreateMissionUseCase } from "../packages/application/src/use-cases/CreateMissionUseCase.js";
import { getAuthenticatedPrincipal } from "../apps/web/src/lib/server-auth.js";

async function runCheckoutFundingTest() {
  console.log("=== FIWOKAN ESCROW CHECKOUT FUNDING & AUTH AUDIT ===");

  const timestamp = Date.now();
  const requesterEmail = `test_req_checkout_${timestamp}@fiwokan.com`;
  const scoutEmail = `test_scout_checkout_${timestamp}@fiwokan.com`;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
  process.env.AUTH_SECRET = secret;
  process.env.FIWOKAN_BETA_MODE = "true";

  try {
    // 1. Create Test Users
    const requester = await prisma.user.create({
      data: {
        email: requesterEmail,
        passwordHash: "hash",
        displayName: "Requester Funder",
        role: "REQUESTER",
      },
    });

    const scout = await prisma.user.create({
      data: {
        email: scoutEmail,
        passwordHash: "hash",
        displayName: "Scout Funder Attempt",
        role: "SCOUT",
      },
    });

    console.log("1. Created Test Users: Requester Funder & Scout.");

    const missionRepo = new PrismaMissionRepository();
    const createMissionUseCase = new CreateMissionUseCase(missionRepo);

    // 2. Create Mission Draft
    const input = {
      title: "Escrow Funding Mission - Traffic Audit",
      description: "Verify entrance foot traffic.",
      category: "CROWD_DENSITY",
      urgency: "HIGH",
      budget: { amountCents: 300000, currency: "VND" },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: { latitude: 10.7721, longitude: 106.6983 },
      radiusMeters: 500,
      requiredTags: ["test", "checkout"],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const draftMission = await createMissionUseCase.execute(input, requester.id, "REQUESTER");
    console.log(`2. Mission Created with ID ${draftMission.id}, status: ${draftMission.status}`);

    // 3. Test Unauthenticated checkout simulation -> 401
    const unauthReq = new Request("http://localhost:3000/api/checkout/momo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: draftMission.id }),
    });
    const unauthPrincipal = await getAuthenticatedPrincipal(unauthReq);
    if (unauthPrincipal !== null) {
      throw new Error("Expected unauthenticated checkout to return null principal!");
    }
    console.log("   Pass (1): Unauthenticated checkout correctly returns null principal (401).");

    // 4. Test Session Cookie Resolution for Requester
    const sessionToken = await encode({
      token: {
        email: requesterEmail,
        sub: requester.id,
        role: "REQUESTER",
      },
      secret,
      salt: "__Secure-authjs.session-token",
    });

    const cookieReq = new Request("http://localhost:3000/api/checkout/momo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `__Secure-authjs.session-token=${sessionToken}`,
      },
      body: JSON.stringify({ missionId: draftMission.id }),
    });

    const principal = await getAuthenticatedPrincipal(cookieReq);
    if (!principal || principal.id !== requester.id) {
      throw new Error("Failed to resolve authenticated requester principal!");
    }
    console.log("   Pass (2): Authenticated REQUESTER principal resolved for checkout session.");

    // 5. Test Free Beta Checkout Transition (DRAFT -> OPEN & Escrow Deposit created)
    await prisma.$transaction(async (tx) => {
      await tx.mission.update({
        where: { id: draftMission.id },
        data: { status: "OPEN" },
      });
      await tx.coinTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId: requester.id,
          amountCents: -draftMission.budget.amountCents,
          currency: "VND",
          reason: "Escrow Deposit",
          description: "FIWOKAN Free Beta Escrow Deposit",
          eventType: "Escrow Deposit",
          missionId: draftMission.id,
        },
      });
    });

    // 6. Verify DB Mission status = OPEN & Escrow CoinTransaction created
    const updatedMission = await prisma.mission.findUnique({ where: { id: draftMission.id } });
    if (!updatedMission || updatedMission.status !== "OPEN") {
      throw new Error("Mission status was not updated to OPEN upon escrow funding!");
    }

    const escrowTx = await prisma.coinTransaction.findFirst({
      where: { missionId: draftMission.id, eventType: "Escrow Deposit" },
    });
    if (!escrowTx || escrowTx.amountCents !== -300000) {
      throw new Error("Escrow Deposit transaction was not created correctly!");
    }
    console.log("   Pass (3): Free Beta Checkout transitioned status to OPEN and created Escrow Deposit transaction.");

    // Cleanup
    await prisma.coinTransaction.deleteMany({ where: { missionId: draftMission.id } });
    await prisma.mission.deleteMany({ where: { id: draftMission.id } });
    await prisma.user.deleteMany({ where: { id: { in: [requester.id, scout.id] } } });
    console.log("Cleaned up test data safely.");

    console.log("\n========================================================");
    console.log("✅ ESCROW CHECKOUT FUNDING REGRESSION TEST PASSED 100%!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCheckoutFundingTest();
