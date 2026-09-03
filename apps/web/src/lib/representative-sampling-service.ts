/* eslint-disable */
import { prisma } from "@/lib/prisma";

export async function upsertSamplingPlan(
  missionId: string,
  strategy: string,
  variables: string[],
  quotas: any[],
) {
  return await prisma.$transaction(async (tx) => {
    const plan = await tx.samplingPlan.upsert({
      where: { missionId },
      update: { strategy, variables },
      create: { missionId, strategy, variables },
    });

    await tx.samplingQuota.deleteMany({ where: { planId: plan.id } });

    if (quotas && quotas.length > 0) {
      await tx.samplingQuota.createMany({
        data: quotas.map((q: any) => ({
          planId: plan.id,
          criteria: q.criteria,
          targetCount: q.targetCount,
        })),
      });
    }

    return plan;
  });
}

export async function evaluateWorkerSampling(
  missionId: string,
  workerId: string,
): Promise<{ eligible: boolean; quotaId?: string; reason?: string }> {
  const plan = await prisma.samplingPlan.findUnique({
    where: { missionId },
    include: { quotas: true },
  });

  if (!plan) return { eligible: true };
  if (plan.quotas.length === 0) return { eligible: true };

  const audienceProfile = await prisma.audienceProfile.findUnique({ where: { userId: workerId } });
  const userProfile = await prisma.userProfile.findUnique({ where: { userId: workerId } });

  const attrs: Record<string, any> = {
    ...userProfile,
    ...audienceProfile,
  };

  const matchedQuotas = plan.quotas.filter((quota) => {
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

  const openQuota = matchedQuotas.find((q) => !q.isFull);

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
    include: { plan: true },
  });

  if (
    quota.plan.strategy === "STRICT" &&
    quota.reservedCount + quota.completedCount > quota.targetCount
  ) {
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
      data: { reservedCount: { decrement: 1 } },
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
      completedCount: { increment: 1 },
    },
  });

  if (quota.reservedCount + quota.completedCount >= quota.targetCount) {
    await tx.samplingQuota.update({ where: { id: quotaId }, data: { isFull: true } });
  }
}
