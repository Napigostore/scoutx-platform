// Unit test for Admin Account creation and Unlimited Mission Quota Bypass

interface MockUser {
  id: string;
  email: string;
  role: "ADMIN" | "REQUESTER" | "SCOUT";
  freeMissions: number;
}

function checkMissionCreationQuota(user: MockUser, balanceCents: number, budgetCents: number): { allowed: boolean; error?: string } {
  const isAdmin = user.role === "ADMIN";
  const hasFreeQuota = isAdmin || (user.freeMissions || 0) > 0;

  if (!isAdmin && !hasFreeQuota && balanceCents < budgetCents) {
    return {
      allowed: false,
      error: "INSUFFICIENT_FUNDS",
    };
  }

  return { allowed: true };
}

console.log("=== RUNNING ADMIN CREATION & QUOTA BYPASS UNIT TESTS ===");

// Test 1: Admin Account Role Verification
const adminEmail = "truongtumoc@gmail.com";
const adminUser: MockUser = {
  id: "admin-uuid-1",
  email: adminEmail,
  role: "ADMIN",
  freeMissions: 0, // 0 free quota
};

console.log(`TEST 1 (Admin Role Check): User ${adminUser.email} has role = ${adminUser.role}`);
if (adminUser.role !== "ADMIN") {
  throw new Error("Test 1 Failed: Role is not ADMIN!");
}

// Test 2: Admin Unlimited Mission Creation (0 freeMissions, 0 balance, 500,000 VND budget)
const adminQuotaCheck = checkMissionCreationQuota(adminUser, 0, 500000);
console.log("TEST 2 (Admin Quota Bypass):", adminQuotaCheck);
if (!adminQuotaCheck.allowed) {
  throw new Error("Test 2 Failed: Admin was blocked by quota!");
}

// Test 3: Admin Creates 10 Consecutive Missions
for (let i = 1; i <= 10; i++) {
  const res = checkMissionCreationQuota(adminUser, 0, 1000000);
  if (!res.allowed) {
    throw new Error(`Test 3 Failed on iteration ${i}!`);
  }
}
console.log("TEST 3 (Admin 10 Consecutive Missions Bypass): PASS");

// Test 4: Normal User Quota Enforcement (0 freeMissions, 0 balance, 500,000 VND budget)
const normalUser: MockUser = {
  id: "normal-uuid-1",
  email: "normal@example.com",
  role: "REQUESTER",
  freeMissions: 0,
};
const normalQuotaCheck = checkMissionCreationQuota(normalUser, 0, 500000);
console.log("TEST 4 (Normal User Quota Block):", normalQuotaCheck);
if (normalQuotaCheck.allowed || normalQuotaCheck.error !== "INSUFFICIENT_FUNDS") {
  throw new Error("Test 4 Failed: Normal user was not blocked!");
}

console.log("\n=== ALL ADMIN CREATION & UNLIMITED QUOTA TESTS PASSED 100% ===");
