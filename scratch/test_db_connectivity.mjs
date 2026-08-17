import { prisma } from "../apps/web/src/lib/prisma.js";

async function runDbCheck() {
  console.log("=== PRISMA DATABASE CONNECTIVITY AUDIT ===");

  const rawDbUrl = process.env.DATABASE_URL || "";
  const startsWithPg = rawDbUrl.startsWith("postgresql://") || rawDbUrl.startsWith("postgres://");
  
  console.log("1. DATABASE_URL Scheme Validation:");
  console.log("   - Key present:", Boolean(rawDbUrl));
  console.log("   - Valid PostgreSQL scheme (postgresql:// or postgres://):", startsWithPg);

  if (!rawDbUrl) {
    console.error("❌ FAIL: DATABASE_URL is missing!");
    process.exit(1);
  }

  if (!startsWithPg) {
    console.error("❌ FAIL: DATABASE_URL does not begin with postgresql:// or postgres://");
    process.exit(1);
  }

  console.log("2. Testing Prisma Connection & Raw SQL Execution...");
  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("   - Raw Query Output:", result);
    console.log("   ✅ Connection successful!");
  } catch (err) {
    console.error("❌ FAIL: Prisma queryRaw threw an error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  console.log("3. Testing Prisma Table Access (User & Mission Counts)...");
  try {
    const userCount = await prisma.user.count();
    const missionCount = await prisma.mission.count();
    console.log(`   - User Count: ${userCount}`);
    console.log(`   - Mission Count: ${missionCount}`);
    console.log("   ✅ Database tables queried successfully!");
  } catch (err) {
    console.error("❌ FAIL: Table query failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  console.log("\n========================================================");
  console.log("✅ DATABASE CONNECTIVITY & PRISMA VERIFICATION PASSED 100%!");
  console.log("========================================================\n");
}

runDbCheck().catch(console.error).finally(() => prisma.$disconnect());
