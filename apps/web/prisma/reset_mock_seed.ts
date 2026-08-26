import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function resetMockSeed() {
  console.log("==========================================================");
  console.log("   RESET MOCK SEED DATA (NAMESPACE: *@seed.fiwokan.com)");
  console.log("==========================================================");

  // Delete evidence created by mock seed users
  const deletedEvidence = await prisma.evidence.deleteMany({
    where: { user: { email: { endsWith: "@seed.fiwokan.com" } } },
  });
  console.log(`[RESET] Deleted ${deletedEvidence.count} mock evidence records.`);

  // Delete timeline entries created by mock seed missions
  const deletedTimeline = await prisma.timelineEntry.deleteMany({
    where: { mission: { requester: { email: { endsWith: "@seed.fiwokan.com" } } } },
  });
  console.log(`[RESET] Deleted ${deletedTimeline.count} mock timeline entries.`);

  // Delete mission submissions created by mock seed users
  const deletedSubmissions = await prisma.missionSubmission.deleteMany({
    where: { user: { email: { endsWith: "@seed.fiwokan.com" } } },
  });
  console.log(`[RESET] Deleted ${deletedSubmissions.count} mock submissions.`);

  // Delete missions created by mock requesters
  const deletedMissions = await prisma.mission.deleteMany({
    where: { requester: { email: { endsWith: "@seed.fiwokan.com" } } },
  });
  console.log(`[RESET] Deleted ${deletedMissions.count} mock missions.`);

  // Delete scout profiles created by mock seed users
  const deletedProfiles = await prisma.scoutProfile.deleteMany({
    where: { user: { email: { endsWith: "@seed.fiwokan.com" } } },
  });
  console.log(`[RESET] Deleted ${deletedProfiles.count} mock scout profiles.`);

  // Delete trust scores created by mock seed users
  const deletedTrust = await prisma.trustScore.deleteMany({
    where: { user: { email: { endsWith: "@seed.fiwokan.com" } } },
  });
  console.log(`[RESET] Deleted ${deletedTrust.count} mock trust scores.`);

  // Delete users created by mock seed
  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { endsWith: "@seed.fiwokan.com" } },
  });
  console.log(`[RESET] Deleted ${deletedUsers.count} mock users.`);

  console.log("==========================================================");
  console.log("   MOCK SEED DATA CLEANUP COMPLETED SUCCESSFULLY");
  console.log("==========================================================");
}

if (require.main === module) {
  resetMockSeed()
    .catch((e) => {
      console.error("[RESET_ERROR]", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
