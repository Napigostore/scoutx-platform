/**
 * MANUAL SCRIPT — DO NOT CALL FROM BUILD/DEPLOY PIPELINE
 *
 * Updates passwordHash of @seed.fiwokan.com mock accounts ONLY.
 * Run manually when needed:
 *   pnpm --filter @scoutx/web db:update-seed
 *
 * NEVER add this to: build, postbuild, postinstall, Vercel hooks.
 */
import { PrismaClient } from "@prisma/client";

// Safety guard: refuse to run if invoked during a CI/Vercel build
if (process.env.VERCEL === "1" || process.env.CI === "true") {
  console.error("[update_seed_passwords] BLOCKED: This script must not run during CI/Vercel builds.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function updatePasswords() {
  console.log("--- START SEED PASSWORD UPDATE ---");
  const usersCount = await prisma.user.count({
    where: { email: { endsWith: "@seed.fiwokan.com" } },
  });
  
  console.log(`Found ${usersCount} mock users in @seed.fiwokan.com namespace to update.`);
  
  if (usersCount > 0) {
    const allCount = await prisma.user.count();
    console.log(`Total users in DB: ${allCount}`);
    
    const res = await prisma.user.updateMany({
      where: { email: { endsWith: "@seed.fiwokan.com" } },
      data: { passwordHash: "hashed:MockScout123!" },
    });
    console.log(`Successfully updated ${res.count} mock users with valid password hash.`);
  } else {
    console.log("No mock users found.");
  }
  console.log("--- END SEED PASSWORD UPDATE ---");
}

updatePasswords()
  .catch((e) => {
    console.error("Failed to update passwords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
