import { prisma } from "../apps/web/src/lib/prisma.js";
import { PrismaMissionRepository } from "../packages/infrastructure/src/repositories/PrismaMissionRepository.js";

async function debugScoutDiscovery() {
  console.log("=== DEBUG SCOUT MISSION DISCOVERY (ACCOUNT A vs ACCOUNT B) ===");

  try {
    const allMissions = await prisma.mission.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        requesterId: true,
        assignedScoutId: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`1. Total Missions in Database: ${allMissions.length}`);
    allMissions.forEach((m, idx) => {
      console.log(`   [${idx + 1}] ID: ${m.id} | Status: ${m.status} | Requester: ${m.requesterId} | AssignedScout: ${m.assignedScoutId || "null"} | ExpiresAt: ${m.expiresAt}`);
    });

    const missionRepo = new PrismaMissionRepository();
    const availableMissions = await missionRepo.findAvailable();

    console.log(`\n2. GET /api/scout/missions (findAvailable Query Results): ${availableMissions.length}`);
    availableMissions.forEach((m, idx) => {
      console.log(`   [${idx + 1}] Title: "${m.title}" | Status: ${m.status} | Requester: ${m.requesterId}`);
    });

    console.log("\n3. Status Breakdown Analysis:");
    const drafts = allMissions.filter(m => m.status === "DRAFT");
    const opens = allMissions.filter(m => m.status === "OPEN");
    const matched = allMissions.filter(m => m.status === "MATCHED");
    const inProgress = allMissions.filter(m => m.status === "IN_PROGRESS");

    console.log(`   - DRAFT status (Private to Requester): ${drafts.length}`);
    console.log(`   - OPEN status (Publicly Available to Scouts): ${opens.length}`);
    console.log(`   - MATCHED status (Claimed by a Scout): ${matched.length}`);
    console.log(`   - IN_PROGRESS status (Started by a Scout): ${inProgress.length}`);

    if (drafts.length > 0 && opens.length === 0) {
      console.log("\n⚠️ DIAGNOSIS CONFIRMED:");
      console.log("   Account A's mission is currently in 'DRAFT' status.");
      console.log("   Scout Account B cannot see Account A's mission in GET /api/scout/missions because findAvailable() filters strictly for status = 'OPEN'.");
      console.log("   Account A must publish the mission (POST /api/missions/[id]/publish or Checkout Funding) to transition status DRAFT -> OPEN before it becomes discoverable by Scouts.");
    }
  } catch (err) {
    console.error("Error during debug:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugScoutDiscovery();
