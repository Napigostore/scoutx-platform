import { prisma } from "@/lib/prisma";
import { type Prisma } from "@prisma/client";

export type OptimizationCategory = "QUOTA" | "REWARD" | "SCREENING" | "SCHEDULE" | "QUALITY";
export type OptimizationAction =
  | { type: "ADJUST_QUOTA"; payload: { newTarget: number } }
  | { type: "ADJUST_REWARD"; payload: { newAmount: number } }
  | { type: "RELAX_SCREENING"; payload: { rulesToRemove: string[] } }
  | { type: "EXTEND_SCHEDULE"; payload: { newExpiresAt: Date } }
  | { type: "TIGHTEN_QUALITY"; payload: { newThreshold: number } };

export interface OptimizationMetrics {
  completionRate: number;
  recruitmentVelocityPerHour: number;
  remainingBudget: number;
  abandonmentRate: number;
}

export const DANGEROUS_OPTIMIZATION_TYPES = ["ADJUST_REWARD", "RELAX_SCREENING", "ADJUST_QUOTA"];

export async function calculateOptimizationScore(
  metrics: OptimizationMetrics,
): Promise<{ score: number; forecast: string }> {
  let score = 100;
  if (metrics.completionRate < 50) score -= 20;
  if (metrics.recruitmentVelocityPerHour < 1) score -= 30;
  if (metrics.abandonmentRate > 20) score -= 15;
  score = Math.max(0, score);

  let forecast = "On track to complete within schedule.";
  if (score < 50) forecast = "At risk of missing targets due to low recruitment velocity.";
  else if (score < 80)
    forecast = "Progressing, but optimization recommended to ensure timely completion.";

  return { score, forecast };
}

export async function generateRecommendations(missionId: string, metrics: OptimizationMetrics) {
  const recommendations: Prisma.OptimizationRecommendationCreateInput[] = [];

  // If velocity is too low, suggest extending schedule (safe to auto-execute potentially, but let's say requires review)
  if (metrics.recruitmentVelocityPerHour < 1) {
    recommendations.push({
      mission: { connect: { id: missionId } },
      title: "Extend Fieldwork Schedule",
      description: "Recruitment is slower than expected. Extend the deadline to reach target.",
      category: "SCHEDULE",
      confidenceScore: 0.85,
      projectedImpact: "Will allow 20% more participants to join.",
      suggestedAction: {
        type: "EXTEND_SCHEDULE",
        payload: { newExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
      },
      isAutoExecutable: false,
      requiresHumanReview: true,
      reasoning: "Velocity is below 1 complete/hour.",
    });
  }

  // If completion rate is low, maybe reward is too low
  if (metrics.completionRate < 50 && metrics.remainingBudget > 0) {
    recommendations.push({
      mission: { connect: { id: missionId } },
      title: "Increase Reward",
      description: "Low completion rate indicates the reward may not be competitive.",
      category: "REWARD",
      confidenceScore: 0.9,
      projectedImpact: "Expected to double recruitment velocity.",
      suggestedAction: { type: "ADJUST_REWARD", payload: { newAmount: 150 } },
      isAutoExecutable: false, // DANGEROUS
      requiresHumanReview: true,
      reasoning: "Completion rate is below 50%.",
    });
  }

  return recommendations;
}

export async function executeRecommendation(
  recommendationId: string,
  actorId: string | null = null,
) {
  return await prisma.$transaction(async (tx) => {
    const rec = await tx.optimizationRecommendation.findUnique({
      where: { id: recommendationId },
      include: { mission: { include: { fieldwork: true } } },
    });

    if (!rec) throw new Error("Recommendation not found");
    if (rec.status !== "PENDING" && rec.status !== "APPROVED") {
      throw new Error("Invalid state: Recommendation is not pending or approved");
    }

    const action = rec.suggestedAction as OptimizationAction;

    // AI Safety Guard: AI cannot auto-execute dangerous actions
    if (!actorId && DANGEROUS_OPTIMIZATION_TYPES.includes(action.type)) {
      throw new Error(`Safety Violation: Action ${action.type} requires human approval.`);
    }

    const oldState = rec.mission.fieldwork ? { ...rec.mission.fieldwork } : null;

    // Perform action
    if (action.type === "EXTEND_SCHEDULE" && rec.mission.fieldwork) {
      await tx.surveyFieldwork.update({
        where: { missionId: rec.mission.id },
        data: { expiresAt: new Date(action.payload.newExpiresAt) },
      });
    } else if (action.type === "ADJUST_REWARD") {
      if (!actorId) throw new Error("Safety Violation: AI cannot adjust reward");
      // Execute reward logic...
    } else if (action.type === "ADJUST_QUOTA") {
      if (!actorId) throw new Error("Safety Violation: AI cannot adjust quota");
    } else if (action.type === "RELAX_SCREENING") {
      if (!actorId) throw new Error("Safety Violation: AI cannot relax screening");
    }

    // Mark recommendation as executed
    const updatedRec = await tx.optimizationRecommendation.update({
      where: { id: rec.id, version: rec.version }, // Concurrency protection
      data: {
        status: "EXECUTED",
        version: { increment: 1 },
      },
    });

    const newState = await tx.surveyFieldwork.findUnique({ where: { missionId: rec.mission.id } });

    // Record Event
    await tx.optimizationEvent.create({
      data: {
        recommendationId: rec.id,
        missionId: rec.mission.id,
        actionType: actorId ? "EXECUTED" : "AUTO_EXECUTED",
        performedById: actorId,
        oldState: oldState as unknown as Prisma.InputJsonValue,
        newState: newState as unknown as Prisma.InputJsonValue,
        reason: "Applied optimization",
      },
    });

    return updatedRec;
  });
}

export async function markStaleRecommendations(missionId: string) {
  // Stale guard: if mission state changes significantly, pending recommendations might be invalid
  await prisma.optimizationRecommendation.updateMany({
    where: {
      missionId,
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) }, // e.g. older than 24h
    },
    data: { status: "STALE" },
  });
}
