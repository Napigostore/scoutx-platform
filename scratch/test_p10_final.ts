
import assert from 'assert';

let dbState = {
  plan: { strategy: 'STRICT', variables: ['education'] },
  quotas: [
    { id: 'q1', criteria: { education: 'BACHELOR' }, targetCount: 2, reservedCount: 0, completedCount: 0, isFull: false, plan: null },
    { id: 'q2', criteria: { education: 'HIGH_SCHOOL' }, targetCount: 1, reservedCount: 1, completedCount: 0, isFull: true, plan: null }
  ],
  profiles: {
    'w-bachelor': { education: 'BACHELOR' },
    'w-highschool': { education: 'HIGH_SCHOOL' },
    'w-phd': { education: 'PHD' },
  }
};

dbState.quotas.forEach(q => q.plan = dbState.plan);

const prisma = {
  samplingPlan: {
    findUnique: async () => ({ ...dbState.plan, quotas: dbState.quotas })
  },
  samplingQuota: {
    findUnique: async ({ where }) => dbState.quotas.find(q => q.id === where.id),
    update: async ({ where, data }) => {
      const q = dbState.quotas.find(q => q.id === where.id);
      if (!q) throw new Error('NotFound');
      if (data.reservedCount?.increment) q.reservedCount++;
      if (data.reservedCount?.decrement) q.reservedCount--;
      if (data.completedCount?.increment) q.completedCount++;
      if (data.isFull !== undefined) q.isFull = data.isFull;
      return { ...q, plan: dbState.plan };
    }
  },
  audienceProfile: {
    findUnique: async ({ where }) => dbState.profiles[where.userId]
  },
  userProfile: { findUnique: async () => ({}) }
};

/* eslint-disable */


export async function upsertSamplingPlan(missionId: string, strategy: string, variables: string[], quotas: any[]) {
  return await prisma.$transaction(async (tx) => {
    const plan = await tx.samplingPlan.upsert({
      where: { missionId },
      update: { strategy, variables },
      create: { missionId, strategy, variables }
    });

    await tx.samplingQuota.deleteMany({ where: { planId: plan.id } });
    
    if (quotas && quotas.length > 0) {
      await tx.samplingQuota.createMany({
        data: quotas.map((q: any) => ({
          planId: plan.id,
          criteria: q.criteria,
          targetCount: q.targetCount
        }))
      });
    }

    return plan;
  });
}

export async function evaluateWorkerSampling(missionId: string, workerId: string): Promise<{ eligible: boolean, quotaId?: string, reason?: string }> {
  const plan = await prisma.samplingPlan.findUnique({
    where: { missionId },
    include: { quotas: true }
  });

  if (!plan) return { eligible: true };
  if (plan.quotas.length === 0) return { eligible: true };

  const audienceProfile = await prisma.audienceProfile.findUnique({ where: { userId: workerId } });
  const userProfile = await prisma.userProfile.findUnique({ where: { userId: workerId } });

  const attrs: Record<string, any> = {
    ...userProfile,
    ...audienceProfile
  };

  const matchedQuotas = plan.quotas.filter(quota => {
     const criteria = quota.criteria as Record<string, any>;
     const variables = plan.variables as string[];
     
     for (const v of variables) {
       if (criteria[v] !== undefined && criteria[v] !== attrs[v]) {
         return false; 
       }
     }
     return true;
  });

  if (matchedQuotas.length === 0) {
    return { eligible: false, reason: "SAMPLING_NO_MATCH" };
  }

  const openQuota = matchedQuotas.find(q => !q.isFull);
  
  if (!openQuota) {
    if (plan.strategy === "STRICT") {
      return { eligible: false, reason: "SAMPLING_QUOTA_FULL" };
    } else {
      return { eligible: true, quotaId: matchedQuotas[0]?.id };
    }
  }

  return { eligible: true, quotaId: openQuota.id };
}

export async function reserveSamplingSlot(tx: any, quotaId: string) {
  const quota = await tx.samplingQuota.update({
    where: { id: quotaId },
    data: { reservedCount: { increment: 1 } },
    include: { plan: true }
  });
  
  if (quota.plan.strategy === "STRICT" && quota.reservedCount + quota.completedCount > quota.targetCount) {
    throw new Error("SAMPLING_QUOTA_OVERBOOKED");
  }

  if (quota.reservedCount + quota.completedCount >= quota.targetCount) {
    await tx.samplingQuota.update({ where: { id: quotaId }, data: { isFull: true } });
  }
}

export async function releaseSamplingSlot(tx: any, quotaId: string) {
  let quota = await tx.samplingQuota.findUnique({ where: { id: quotaId } });
  if (quota && quota.reservedCount > 0) {
    quota = await tx.samplingQuota.update({
      where: { id: quotaId },
      data: { reservedCount: { decrement: 1 } }
    });
  }
  
  if (quota && quota.reservedCount + quota.completedCount < quota.targetCount) {
    await tx.samplingQuota.update({ where: { id: quotaId }, data: { isFull: false } });
  }
}

export async function commitSamplingSlot(tx: any, quotaId: string) {
  let quota = await tx.samplingQuota.findUnique({ where: { id: quotaId } });
  if (!quota) return;

  quota = await tx.samplingQuota.update({
    where: { id: quotaId },
    data: { 
      reservedCount: quota.reservedCount > 0 ? { decrement: 1 } : undefined,
      completedCount: { increment: 1 }
    }
  });

  if (quota.reservedCount + quota.completedCount >= quota.targetCount) {
    await tx.samplingQuota.update({ where: { id: quotaId }, data: { isFull: true } });
  }
}


async function runAuditTests() {
  console.log('=== P10 AUDIT TESTS ===');

  let evalRes = await evaluateWorkerSampling('m1', 'w-phd');
  assert.strictEqual(evalRes.eligible, false);
  assert.strictEqual(evalRes.reason, 'SAMPLING_NO_MATCH');
  console.log('PASS: Unmatched worker rejected with SAMPLING_NO_MATCH');

  evalRes = await evaluateWorkerSampling('m1', 'w-highschool');
  assert.strictEqual(evalRes.eligible, false);
  assert.strictEqual(evalRes.reason, 'SAMPLING_QUOTA_FULL');
  console.log('PASS: STRICT worker matching full quota rejected');

  dbState.plan.strategy = 'FLEXIBLE';
  evalRes = await evaluateWorkerSampling('m1', 'w-highschool');
  assert.strictEqual(evalRes.eligible, true);
  assert.strictEqual(evalRes.quotaId, 'q2');
  console.log('PASS: FLEXIBLE worker matching full quota allowed');
  
  dbState.plan.strategy = 'STRICT';

  await reserveSamplingSlot(prisma, 'q1');
  const q1_state1 = dbState.quotas.find(q => q.id === 'q1');
  assert.strictEqual(q1_state1.reservedCount, 1);
  
  await reserveSamplingSlot(prisma, 'q1');
  const q1_state2 = dbState.quotas.find(q => q.id === 'q1');
  assert.strictEqual(q1_state2.reservedCount, 2);
  assert.strictEqual(q1_state2.isFull, true); 

  try {
    await reserveSamplingSlot(prisma, 'q1');
    assert.fail('Should throw SAMPLING_QUOTA_OVERBOOKED');
  } catch (e) {
    assert.strictEqual(e.message, 'SAMPLING_QUOTA_OVERBOOKED');
  }
  console.log('PASS: Reserve limits & Overbooking prevented');

  await releaseSamplingSlot(prisma, 'q1'); 
  await releaseSamplingSlot(prisma, 'q1'); 
  await releaseSamplingSlot(prisma, 'q1'); 
  assert.strictEqual(q1_state1.reservedCount, 0);
  assert.strictEqual(q1_state1.isFull, false);
  console.log('PASS: Release doesnt cause negative reservedCount');

  await reserveSamplingSlot(prisma, 'q1'); 
  assert.strictEqual(q1_state1.reservedCount, 1);
  assert.strictEqual(q1_state1.completedCount, 0);
  
  await commitSamplingSlot(prisma, 'q1'); 
  assert.strictEqual(q1_state1.reservedCount, 0);
  assert.strictEqual(q1_state1.completedCount, 1);
  
  await commitSamplingSlot(prisma, 'q1'); 
  assert.strictEqual(q1_state1.reservedCount, 0); 
  assert.strictEqual(q1_state1.completedCount, 2);
  assert.strictEqual(q1_state1.isFull, true);
  console.log('PASS: Commit correctly shifts counts and prevents negative reserves');

  console.log('=== ALL 6 TESTS PASSED ===');
}

runAuditTests().catch(e => {
  console.error('FAIL:', e);
  process.exit(1);
});
