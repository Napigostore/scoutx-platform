import { prisma } from "../apps/web/src/lib/prisma";
import { evaluateWorkerSampling, reserveSamplingSlot, releaseSamplingSlot, commitSamplingSlot } from "../apps/web/src/lib/representative-sampling-service";
import assert from "assert";

// In-memory mock state for the test
let dbState = {
  plan: { strategy: "STRICT", variables: ["education"] },
  quotas: [
    { id: "q1", criteria: { education: "BACHELOR" }, targetCount: 2, reservedCount: 0, completedCount: 0, isFull: false },
    { id: "q2", criteria: { education: "HIGH_SCHOOL" }, targetCount: 1, reservedCount: 1, completedCount: 0, isFull: true }
  ],
  profiles: {
    "w-bachelor": { education: "BACHELOR" },
    "w-highschool": { education: "HIGH_SCHOOL" },
    "w-phd": { education: "PHD" },
  }
};

const mockPrisma = {
  samplingPlan: {
    findUnique: async () => ({ ...dbState.plan, quotas: dbState.quotas })
  },
  samplingQuota: {
    findUnique: async ({ where }: any) => dbState.quotas.find(q => q.id === where.id),
    update: async ({ where, data }: any) => {
      const q = dbState.quotas.find(q => q.id === where.id);
      if (!q) throw new Error("NotFound");
      if (data.reservedCount?.increment) q.reservedCount++;
      if (data.reservedCount?.decrement) q.reservedCount--;
      if (data.completedCount?.increment) q.completedCount++;
      if (data.isFull !== undefined) q.isFull = data.isFull;
      return { ...q, plan: dbState.plan };
    }
  },
  audienceProfile: {
    findUnique: async ({ where }: any) => dbState.profiles[where.userId as keyof typeof dbState.profiles]
  },
  userProfile: { findUnique: async () => ({}) }
};

// Inject mock
import * as service from "../apps/web/src/lib/representative-sampling-service";
(service as any).prisma = mockPrisma;

async function runAuditTests() {
  console.log("=== P10 AUDIT TESTS ===");

  // 1. Worker không match quota bị reject đúng reason
  let evalRes = await evaluateWorkerSampling("m1", "w-phd");
  assert.strictEqual(evalRes.eligible, false);
  assert.strictEqual(evalRes.reason, "SAMPLING_NO_MATCH");
  console.log("PASS: Unmatched worker rejected with SAMPLING_NO_MATCH");

  // 2. STRICT: worker match nhưng full -> reject
  evalRes = await evaluateWorkerSampling("m1", "w-highschool");
  assert.strictEqual(evalRes.eligible, false);
  assert.strictEqual(evalRes.reason, "SAMPLING_QUOTA_FULL");
  console.log("PASS: STRICT worker matching full quota rejected");

  // 3. FLEXIBLE: worker match nhưng full -> allow
  dbState.plan.strategy = "FLEXIBLE";
  evalRes = await evaluateWorkerSampling("m1", "w-highschool");
  assert.strictEqual(evalRes.eligible, true);
  assert.strictEqual(evalRes.quotaId, "q2");
  console.log("PASS: FLEXIBLE worker matching full quota allowed");
  
  // Revert to STRICT
  dbState.plan.strategy = "STRICT";

  // 4. Reserve không vượt targetCount & Overbooking
  await reserveSamplingSlot(mockPrisma, "q1");
  const q1_state1 = dbState.quotas.find(q => q.id === "q1")!;
  assert.strictEqual(q1_state1.reservedCount, 1);
  
  await reserveSamplingSlot(mockPrisma, "q1");
  const q1_state2 = dbState.quotas.find(q => q.id === "q1")!;
  assert.strictEqual(q1_state2.reservedCount, 2);
  assert.strictEqual(q1_state2.isFull, true); // marked full

  // Overbook attempt
  try {
    await reserveSamplingSlot(mockPrisma, "q1");
    assert.fail("Should throw SAMPLING_QUOTA_OVERBOOKED");
  } catch (e: any) {
    assert.strictEqual(e.message, "SAMPLING_QUOTA_OVERBOOKED");
  }
  console.log("PASS: Reserve limits & Overbooking prevented");

  // 5. Release không làm reservedCount âm
  await releaseSamplingSlot(mockPrisma, "q1"); // now 1
  await releaseSamplingSlot(mockPrisma, "q1"); // now 0
  await releaseSamplingSlot(mockPrisma, "q1"); // should stay 0
  assert.strictEqual(q1_state1.reservedCount, 0);
  assert.strictEqual(q1_state1.isFull, false);
  console.log("PASS: Release doesn't cause negative reservedCount");

  // 6. Commit properly shifts reserved to completed
  await reserveSamplingSlot(mockPrisma, "q1"); // +1
  assert.strictEqual(q1_state1.reservedCount, 1);
  assert.strictEqual(q1_state1.completedCount, 0);
  
  await commitSamplingSlot(mockPrisma, "q1"); // reserve -1, completed +1
  assert.strictEqual(q1_state1.reservedCount, 0);
  assert.strictEqual(q1_state1.completedCount, 1);
  
  await commitSamplingSlot(mockPrisma, "q1"); // if called again when reserved=0
  assert.strictEqual(q1_state1.reservedCount, 0); // doesn't go negative
  assert.strictEqual(q1_state1.completedCount, 2);
  assert.strictEqual(q1_state1.isFull, true);
  console.log("PASS: Commit correctly shifts counts and prevents negative reserves");

  console.log("=== ALL 6 TESTS PASSED ===");
}

runAuditTests().catch(e => {
  console.error("FAIL:", e);
  process.exit(1);
});
