import { prisma } from "./prisma";

export interface QuotaAnalytics {
  id: string;
  criteria: unknown;
  targetCount: number;
  completedCount: number;
  reservedCount: number;
  fulfillmentPercentage: number;
}

export interface ResearchAnalyticsResult {
  missionId: string;
  overview: {
    totalTarget: number;
    totalCompleted: number;
    completionPercentage: number;
  };
  quotas: QuotaAnalytics[];
  quality: {
    averageDurationSeconds: number;
    averageQualityScore: number;
    rejectionRate: number;
    totalSubmissions: number;
  };
  geography: {
    evidencePoints: Array<{ latitude: number; longitude: number }>;
  };
}

export async function getMissionAnalytics(missionId: string): Promise<ResearchAnalyticsResult> {
  // 1. Fetch Sampling Plan & Quotas (P10)
  const plan = await prisma.samplingPlan.findUnique({
    where: { missionId },
    include: { quotas: true },
  });

  let totalTarget = 0;
  let totalCompleted = 0;
  const quotasAnalytics: QuotaAnalytics[] = [];

  if (plan && plan.quotas.length > 0) {
    for (const quota of plan.quotas) {
      totalTarget += quota.targetCount;
      totalCompleted += quota.completedCount;
      quotasAnalytics.push({
        id: quota.id,
        criteria: quota.criteria,
        targetCount: quota.targetCount,
        completedCount: quota.completedCount,
        reservedCount: quota.reservedCount,
        fulfillmentPercentage:
          quota.targetCount > 0 ? (quota.completedCount / quota.targetCount) * 100 : 0,
      });
    }
  }

  // 2. Fetch Survey Submissions for Quality Metrics
  const surveySubmissions = await prisma.surveySubmission.findMany({
    where: { missionId },
    select: {
      status: true,
      durationSeconds: true,
      qualityScore: true,
    },
  });

  let totalDuration = 0;
  let totalScore = 0;
  let scoreCount = 0;
  let durationCount = 0;
  let rejectedCount = 0;

  for (const sub of surveySubmissions) {
    if (sub.status === "REJECTED") {
      rejectedCount++;
    }
    if (sub.durationSeconds !== null) {
      totalDuration += sub.durationSeconds;
      durationCount++;
    }
    if (sub.qualityScore !== null) {
      totalScore += sub.qualityScore;
      scoreCount++;
    }
  }

  const totalSubmissions = surveySubmissions.length;
  const averageDurationSeconds = durationCount > 0 ? totalDuration / durationCount : 0;
  const averageQualityScore = scoreCount > 0 ? totalScore / scoreCount : 0;
  const rejectionRate = totalSubmissions > 0 ? (rejectedCount / totalSubmissions) * 100 : 0;

  // 3. Fetch Geography from Evidence (or Mission Submissions)
  const evidences = await prisma.evidence.findMany({
    where: { missionId, latitude: { not: null }, longitude: { not: null } },
    select: { latitude: true, longitude: true },
  });

  const evidencePoints = evidences.map((e) => ({
    latitude: e.latitude as number,
    longitude: e.longitude as number,
  }));

  // Fallback to MissionSubmission if no evidence points
  if (evidencePoints.length === 0) {
    const missionSubmissions = await prisma.missionSubmission.findMany({
      where: { missionId },
      select: { latitude: true, longitude: true },
    });
    for (const m of missionSubmissions) {
      evidencePoints.push({
        latitude: m.latitude,
        longitude: m.longitude,
      });
    }
  }

  return {
    missionId,
    overview: {
      totalTarget,
      totalCompleted,
      completionPercentage: totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0,
    },
    quotas: quotasAnalytics,
    quality: {
      averageDurationSeconds,
      averageQualityScore,
      rejectionRate,
      totalSubmissions,
    },
    geography: {
      evidencePoints,
    },
  };
}
