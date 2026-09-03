/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Research Intelligence & Quality Automation Service — P8
 *
 * Provides real-time quality analytics, anomaly detection, health scoring,
 * deterministic alerting, and AI-driven recommendations for live research fieldwork.
 *
 * SAFETY & GOVERNANCE RULES:
 * - Deterministic engine runs BEFORE AI.
 * - AI receives SANITIZED, AGGREGATE metrics only — zero PII, zero credentials.
 * - AI only PROPOSES recommendations; AI CANNOT execute actions, change rewards,
 *   ban workers, modify surveys, or move coins.
 * - Safe actions can be approved by Requester; Dangerous actions require explicit confirmation.
 * - Worker authorization: Workers cannot view intelligence. Outsiders get 403.
 */

import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Types & Schemas ──────────────────────────────────────────────────────────

export type AnomalyType =
  | "SPEEDING"
  | "LOW_QUALITY"
  | "DUPLICATE_PATTERN"
  | "SUSPICIOUS_CLUSTER"
  | "QUOTA_ANOMALY"
  | "RECRUITMENT_DROP"
  | "HIGH_ABANDONMENT"
  | "UNUSUAL_RESPONSE_PATTERN"
  | "DEVICE_PATTERN"
  | "GEO_ANOMALY";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecommendationType =
  | "INCREASE_PRIORITY"
  | "PAUSE_SEGMENT"
  | "EXPAND_AUDIENCE"
  | "ADJUST_QUOTA"
  | "REVIEW_SCREENING"
  | "REVIEW_REWARD"
  | "RESUME_RECRUITMENT";

export type AlertCode =
  | "QUALITY_DROP"
  | "RECRUITMENT_STALLED"
  | "QUOTA_IMBALANCE"
  | "HIGH_ABANDONMENT"
  | "HIGH_REJECTION"
  | "COST_SPIKE"
  | "EXPIRY_RISK"
  | "AUDIENCE_EXHAUSTION";

export const DANGEROUS_ACTIONS: RecommendationType[] = [
  "ADJUST_QUOTA",
  "REVIEW_SCREENING",
  "REVIEW_REWARD",
  "EXPAND_AUDIENCE",
];

// Zod Schema for AI Structured Output
export const AiInsightSchema = z.object({
  summary: z.string(),
  findings: z.array(z.string()),
  recommendations: z.array(
    z.object({
      type: z.enum([
        "INCREASE_PRIORITY",
        "PAUSE_SEGMENT",
        "EXPAND_AUDIENCE",
        "ADJUST_QUOTA",
        "REVIEW_SCREENING",
        "REVIEW_REWARD",
        "RESUME_RECRUITMENT",
      ]),
      payload: z.record(z.unknown()),
      rationale: z.string(),
      isDangerous: z.boolean(),
    }),
  ),
  confidence: z.number().min(0).max(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export type AiInsight = z.infer<typeof AiInsightSchema>;

// Cache for intelligence results (short-term: 30s)
const intelligenceCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 30_000;

// ─── 1. Quality Intelligence & Metrics Engine ─────────────────────────────────

export interface ResearchMetrics {
  totalTarget: number;
  completedCount: number;
  screenedCount: number;
  rejectedCount: number;
  qualityRejectedCount: number;
  abandonedCount: number;
  reservedCount: number;
  inProgressCount: number;
  completionRate: number; // 0..100
  acceptanceRate: number; // 0..100
  rejectionRate: number; // 0..100
  abandonmentRate: number; // 0..100
  averageQualityScore: number;
  medianDurationSeconds: number;
  costPerComplete: number;
  recruitmentVelocityPerHour: number;
  remainingBudget: number;
  spentBudget: number;
}

export async function computeResearchMetrics(missionId: string): Promise<ResearchMetrics> {
  const [fw, mission, submissions, participants] = await Promise.all([
    prisma.surveyFieldwork.findUnique({ where: { missionId } }),
    prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        rewardBudgetCents: true,
        remainingBudgetCents: true,
        maxParticipants: true,
        createdAt: true,
      },
    }),
    prisma.surveySubmission.findMany({
      where: { missionId, durationSeconds: { not: null } },
      select: { durationSeconds: true, qualityScore: true, status: true },
    }),
    prisma.surveyParticipant.groupBy({
      by: ["status"],
      where: { missionId },
      _count: { status: true },
    }),
  ]);

  if (!fw || !mission) throw new Error("Mission or fieldwork not found");

  const statusMap: Record<string, number> = {};
  for (const p of participants) statusMap[p.status] = p._count.status;

  const completed = fw.completedCount;
  const rejected = (statusMap["REJECTED"] ?? 0) + fw.qualityRejectedCount;
  const abandoned = statusMap["ABANDONED"] ?? fw.disqualifiedCount;
  const totalAttempts = completed + rejected + abandoned;

  const completionRate = totalAttempts > 0 ? Math.round((completed / totalAttempts) * 100) : 0;
  const acceptanceRate =
    completed + rejected > 0 ? Math.round((completed / (completed + rejected)) * 100) : 100;
  const rejectionRate = totalAttempts > 0 ? Math.round((rejected / totalAttempts) * 100) : 0;
  const abandonmentRate = totalAttempts > 0 ? Math.round((abandoned / totalAttempts) * 100) : 0;

  // Quality score & duration calculations
  const qualityScores = submissions
    .filter((s) => s.qualityScore != null)
    .map((s) => s.qualityScore!);
  const averageQualityScore =
    qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 100;

  const durations = submissions.map((s) => s.durationSeconds!).sort((a, b) => a - b);
  const medianDurationSeconds =
    durations.length > 0 ? (durations[Math.floor(durations.length / 2)] ?? 0) : 0;

  // Cost per complete
  const totalBudget = mission.rewardBudgetCents ?? 0;
  const spentBudget = totalBudget - (mission.remainingBudgetCents ?? 0);
  const costPerComplete = completed > 0 ? Math.round(spentBudget / completed) : 0;

  // Velocity
  const activeHours = Math.max(
    1,
    (Date.now() - new Date(fw.startedAt ?? mission.createdAt).getTime()) / (1000 * 60 * 60),
  );
  const recruitmentVelocityPerHour = Number((completed / activeHours).toFixed(2));

  return {
    totalTarget: fw.targetCompletes,
    completedCount: completed,
    screenedCount: fw.screenedCount,
    rejectedCount: rejected,
    qualityRejectedCount: fw.qualityRejectedCount,
    abandonedCount: abandoned,
    reservedCount: fw.reservedCount,
    inProgressCount: fw.inProgressCount,
    completionRate,
    acceptanceRate,
    rejectionRate,
    abandonmentRate,
    averageQualityScore,
    medianDurationSeconds,
    costPerComplete,
    recruitmentVelocityPerHour,
    remainingBudget: mission.remainingBudgetCents ?? 0,
    spentBudget,
  };
}

// ─── 2. Research Health Score (0–100) ─────────────────────────────────────────

export interface HealthScoreBreakdown {
  overallScore: number; // 0..100
  recruitmentScore: number; // 0..20
  qualityScore: number; // 0..25
  quotaScore: number; // 0..15
  completionScore: number; // 0..20
  costScore: number; // 0..10
  riskScore: number; // 0..10
  grade: "HEALTHY" | "WARNING" | "CRITICAL";
}

export function calculateResearchHealthScore(
  metrics: ResearchMetrics,
  quotas: Array<{ target: number; filled: number }>,
  anomalyCount: number,
): HealthScoreBreakdown {
  // 1. Recruitment (0..20)
  let recruitmentScore = 20;
  if (metrics.recruitmentVelocityPerHour === 0 && metrics.completedCount < metrics.totalTarget) {
    recruitmentScore = 5;
  } else if (metrics.recruitmentVelocityPerHour < 0.5) {
    recruitmentScore = 12;
  }

  // 2. Quality (0..25)
  let qualityScore = 25;
  if (metrics.averageQualityScore < 60) qualityScore = 5;
  else if (metrics.averageQualityScore < 75) qualityScore = 15;
  else if (metrics.averageQualityScore < 85) qualityScore = 20;

  // 3. Quota Balance (0..15)
  let quotaScore = 15;
  if (quotas.length > 1) {
    const percentages = quotas.map((q) => (q.target > 0 ? (q.filled / q.target) * 100 : 100));
    const minP = Math.min(...percentages);
    const maxP = Math.max(...percentages);
    if (maxP - minP > 50)
      quotaScore = 5; // Imbalanced fill
    else if (maxP - minP > 30) quotaScore = 10;
  }

  // 4. Completion & Abandonment (0..20)
  let completionScore = 20;
  if (metrics.abandonmentRate > 30) completionScore = 5;
  else if (metrics.abandonmentRate > 15) completionScore = 12;

  // 5. Cost Efficiency (0..10)
  let costScore = 10;
  if (metrics.spentBudget > 0 && metrics.completedCount === 0) costScore = 2;

  // 6. Risk & Anomalies (0..10)
  let riskScore = 10;
  if (anomalyCount > 5) riskScore = 2;
  else if (anomalyCount > 2) riskScore = 6;

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      recruitmentScore + qualityScore + quotaScore + completionScore + costScore + riskScore,
    ),
  );

  let grade: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";
  if (overallScore < 50) grade = "CRITICAL";
  else if (overallScore < 75) grade = "WARNING";

  return {
    overallScore,
    recruitmentScore,
    qualityScore,
    quotaScore,
    completionScore,
    costScore,
    riskScore,
    grade,
  };
}

// ─── 3. Deterministic Alert Engine ────────────────────────────────────────────

export interface ResearchAlert {
  code: AlertCode;
  severity: AnomalySeverity;
  message: string;
  metricValue?: string | number;
}

export function evaluateDeterministicAlerts(
  metrics: ResearchMetrics,
  quotas: Array<{ dimension: string; value: string; target: number; filled: number }>,
  expiresAt: Date,
): ResearchAlert[] {
  const alerts: ResearchAlert[] = [];

  // Quality drop alert
  if (metrics.averageQualityScore < 70) {
    alerts.push({
      code: "QUALITY_DROP",
      severity: metrics.averageQualityScore < 50 ? "CRITICAL" : "HIGH",
      message: `Average quality score dropped to ${metrics.averageQualityScore} (threshold: 70).`,
      metricValue: metrics.averageQualityScore,
    });
  }

  // High abandonment
  if (metrics.abandonmentRate > 25) {
    alerts.push({
      code: "HIGH_ABANDONMENT",
      severity: "HIGH",
      message: `High abandonment rate detected: ${metrics.abandonmentRate}% of participants abandoned.`,
      metricValue: `${metrics.abandonmentRate}%`,
    });
  }

  // High rejection
  if (metrics.rejectionRate > 35) {
    alerts.push({
      code: "HIGH_REJECTION",
      severity: "MEDIUM",
      message: `High screening or quality rejection rate: ${metrics.rejectionRate}%.`,
      metricValue: `${metrics.rejectionRate}%`,
    });
  }

  // Quota Imbalance
  if (quotas.length > 1) {
    const percentages = quotas.map((q) => (q.target > 0 ? (q.filled / q.target) * 100 : 100));
    const minP = Math.min(...percentages);
    const maxP = Math.max(...percentages);
    if (maxP - minP >= 40) {
      alerts.push({
        code: "QUOTA_IMBALANCE",
        severity: "MEDIUM",
        message: `Quota progression imbalance: spread between lowest (${minP.toFixed(0)}%) and highest (${maxP.toFixed(0)}%) quota is ${Math.round(maxP - minP)}%.`,
      });
    }
  }

  // Recruitment Stalled
  if (metrics.recruitmentVelocityPerHour === 0 && metrics.completedCount < metrics.totalTarget) {
    alerts.push({
      code: "RECRUITMENT_STALLED",
      severity: "HIGH",
      message: "Recruitment velocity has dropped to 0 completes/hour.",
      metricValue: 0,
    });
  }

  // Expiry Risk
  const hoursRemaining = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const remainingCompletes = metrics.totalTarget - metrics.completedCount;
  if (hoursRemaining > 0 && hoursRemaining < 48 && remainingCompletes > 0) {
    const requiredVelocity = remainingCompletes / hoursRemaining;
    if (metrics.recruitmentVelocityPerHour < requiredVelocity) {
      alerts.push({
        code: "EXPIRY_RISK",
        severity: hoursRemaining < 24 ? "CRITICAL" : "HIGH",
        message: `Fieldwork is at risk of expiring before target completion (${Math.round(hoursRemaining)}h remaining, requires ${requiredVelocity.toFixed(1)}/h).`,
      });
    }
  }

  return alerts;
}

// ─── 4. Deterministic Anomaly Detection & Persistence ─────────────────────────

export async function detectAndPersistAnomalies(
  missionId: string,
  metrics: ResearchMetrics,
): Promise<number> {
  const anomaliesToCreate: Array<{
    type: AnomalyType;
    severity: AnomalySeverity;
    score: number;
    evidence: any;
    workerId?: string;
  }> = [];

  // Check 1: Speeding submissions
  const speedingSubmissions = await prisma.surveySubmission.findMany({
    where: {
      missionId,
      durationSeconds: { not: null, lt: 45 }, // under 45s is severe speeding
    },
    take: 10,
    select: { id: true, durationSeconds: true, participant: { select: { userId: true } } },
  });

  for (const s of speedingSubmissions) {
    anomaliesToCreate.push({
      type: "SPEEDING",
      severity: "HIGH",
      score: 85,
      evidence: { durationSeconds: s.durationSeconds, submissionId: s.id },
      workerId: s.participant.userId,
    });
  }

  // Check 2: High abandonment
  if (metrics.abandonmentRate > 30) {
    anomaliesToCreate.push({
      type: "HIGH_ABANDONMENT",
      severity: "MEDIUM",
      score: metrics.abandonmentRate,
      evidence: {
        abandonmentRate: metrics.abandonmentRate,
        abandonedCount: metrics.abandonedCount,
      },
    });
  }

  // Check 3: Low overall quality
  if (metrics.averageQualityScore < 60) {
    anomaliesToCreate.push({
      type: "LOW_QUALITY",
      severity: "CRITICAL",
      score: 100 - metrics.averageQualityScore,
      evidence: { averageQualityScore: metrics.averageQualityScore },
    });
  }

  // Check 4: Recruitment drop
  if (metrics.recruitmentVelocityPerHour === 0 && metrics.completedCount < metrics.totalTarget) {
    anomaliesToCreate.push({
      type: "RECRUITMENT_DROP",
      severity: "HIGH",
      score: 70,
      evidence: { completedCount: metrics.completedCount, target: metrics.totalTarget },
    });
  }

  let createdCount = 0;
  for (const a of anomaliesToCreate) {
    // Avoid duplicate open anomalies of same type on same mission
    const existing = await prisma.researchAnomaly.findFirst({
      where: {
        missionId,
        type: a.type,
        status: "OPEN",
        ...(a.workerId ? { workerId: a.workerId } : {}),
      },
    });

    if (!existing) {
      await prisma.researchAnomaly.create({
        data: {
          missionId,
          workerId: a.workerId ?? null,
          type: a.type,
          severity: a.severity,
          score: a.score,
          evidence: a.evidence,
          status: "OPEN",
        },
      });
      createdCount++;
    }
  }

  return createdCount;
}

// ─── 5. AI Insights & Proposals (No Execution, Sanitized) ──────────────────────

function sanitizeMetricsForAi(metrics: ResearchMetrics, quotas: any[]) {
  // STRICT PRIVACY: Zero PII, no worker IDs, no names, aggregate only
  return {
    target: metrics.totalTarget,
    completed: metrics.completedCount,
    completionRate: `${metrics.completionRate}%`,
    acceptanceRate: `${metrics.acceptanceRate}%`,
    abandonmentRate: `${metrics.abandonmentRate}%`,
    averageQualityScore: metrics.averageQualityScore,
    medianDurationSeconds: metrics.medianDurationSeconds,
    recruitmentVelocityPerHour: metrics.recruitmentVelocityPerHour,
    costPerComplete: metrics.costPerComplete,
    quotaSummary: quotas.map((q) => ({
      dimension: q.dimension,
      target: q.target,
      filled: q.filled,
      percent: q.percentFilled,
    })),
  };
}

export async function generateAiInsightAndProposals(
  missionId: string,
  sanitizedData: any,
): Promise<AiInsight> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a research quality and panel optimization advisor for ScoutX.
Analyze the following sanitized fieldwork performance data and return a JSON object with:
- summary (concise assessment)
- findings (bullet points of what is happening)
- recommendations (array of objects with { type, payload, rationale, isDangerous })
  - Allowed types: "INCREASE_PRIORITY", "PAUSE_SEGMENT", "EXPAND_AUDIENCE", "ADJUST_QUOTA", "REVIEW_SCREENING", "REVIEW_REWARD", "RESUME_RECRUITMENT"
  - isDangerous MUST be true for: "ADJUST_QUOTA", "REVIEW_SCREENING", "REVIEW_REWARD", "EXPAND_AUDIENCE"
  - isDangerous MUST be false for: "INCREASE_PRIORITY", "PAUSE_SEGMENT", "RESUME_RECRUITMENT"
- confidence (0.0 to 1.0)
- severity ("LOW", "MEDIUM", "HIGH", "CRITICAL")

Do not include any PII or assume unstated demographics.

Data:
${JSON.stringify(sanitizedData, null, 2)}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You output valid JSON strictly matching the schema." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        const validated = AiInsightSchema.safeParse(parsed);
        if (validated.success) return validated.data;
      }
    } catch {
      // Fall through to deterministic fallback
    }
  }

  // Deterministic rule-based fallback
  const recs: any[] = [];
  const findings: string[] = [];

  if (sanitizedData.abandonmentRate && parseInt(sanitizedData.abandonmentRate) > 20) {
    findings.push(`Abandonment rate is high at ${sanitizedData.abandonmentRate}.`);
    recs.push({
      type: "REVIEW_SCREENING",
      payload: { reason: "high_abandonment" },
      rationale: "Review survey length and question difficulty to reduce participant drop-off.",
      isDangerous: true,
    });
  }

  if (sanitizedData.recruitmentVelocityPerHour === 0) {
    findings.push("Recruitment velocity is currently stalled.");
    recs.push({
      type: "INCREASE_PRIORITY",
      payload: { boostLevel: 1 },
      rationale: "Increase matching priority to invite more active panel members.",
      isDangerous: false,
    });
  }

  return {
    summary: `Fieldwork is ${sanitizedData.completionRate} complete with an average quality score of ${sanitizedData.averageQualityScore}.`,
    findings:
      findings.length > 0
        ? findings
        : ["Recruitment progressing steadily with normal quality metrics."],
    recommendations: recs,
    confidence: 0.85,
    severity: sanitizedData.averageQualityScore < 70 ? "HIGH" : "LOW",
  };
}

// ─── 6. Recommendations Management & Requester Approval ───────────────────────

export async function persistRecommendations(
  missionId: string,
  recommendations: AiInsight["recommendations"],
): Promise<number> {
  let created = 0;
  for (const r of recommendations) {
    const hash = crypto
      .createHash("sha256")
      .update(`${missionId}:${r.type}:${JSON.stringify(r.payload)}`)
      .digest("hex")
      .slice(0, 16);
    const idempotencyKey = `INTELLIGENCE_RECOMMENDATION:${missionId}:${hash}`;

    const existing = await prisma.researchRecommendation.findUnique({
      where: { idempotencyKey },
    });

    if (!existing) {
      await prisma.researchRecommendation.create({
        data: {
          missionId,
          type: r.type,
          payload: r.payload as any,
          rationale: r.rationale,
          status: "PENDING",
          idempotencyKey,
        },
      });
      created++;
    }
  }
  return created;
}

export async function approveRecommendation(
  recommendationId: string,
  requesterId: string,
  confirmDangerous = false,
) {
  const rec = await prisma.researchRecommendation.findUnique({
    where: { id: recommendationId },
    include: { mission: { select: { requesterId: true } } },
  });

  if (!rec) throw new Error("Recommendation not found");
  if (rec.mission.requesterId !== requesterId) throw new Error("Forbidden — not mission owner");
  if (rec.status !== "PENDING") throw new Error(`Recommendation already ${rec.status}`);

  const isDangerous = DANGEROUS_ACTIONS.includes(rec.type as RecommendationType);
  if (isDangerous && !confirmDangerous) {
    throw new Error(
      `DANGEROUS_ACTION_REQUIRES_CONFIRMATION: ${rec.type} cannot be approved without explicit confirmation.`,
    );
  }

  // Mark as approved
  const updated = await prisma.researchRecommendation.update({
    where: { id: recommendationId },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });

  return { success: true, recommendation: updated };
}

export async function rejectRecommendation(recommendationId: string, requesterId: string) {
  const rec = await prisma.researchRecommendation.findUnique({
    where: { id: recommendationId },
    include: { mission: { select: { requesterId: true } } },
  });

  if (!rec) throw new Error("Recommendation not found");
  if (rec.mission.requesterId !== requesterId) throw new Error("Forbidden — not mission owner");

  const updated = await prisma.researchRecommendation.update({
    where: { id: recommendationId },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });

  return { success: true, recommendation: updated };
}

// ─── 7. Main Intelligence Facade ──────────────────────────────────────────────

export async function runResearchIntelligence(missionId: string, requesterId: string) {
  // 1. Authorization check
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { requesterId: true, expiresAt: true, quotas: true, category: true },
  });
  if (!mission || mission.category !== "SURVEY") throw new Error("Mission not found");

  const user = await prisma.user.findUnique({ where: { id: requesterId }, select: { role: true } });
  if (user?.role !== "ADMIN" && mission.requesterId !== requesterId) {
    throw new Error("Forbidden — Outsiders and Workers cannot access intelligence");
  }

  // 2. Check cache
  const cached = intelligenceCache.get(missionId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 3. Compute deterministic metrics
  const metrics = await computeResearchMetrics(missionId);

  // 4. Calculate Quotas
  const participants = await prisma.surveyParticipant.findMany({
    where: { missionId, status: { in: ["ACCEPTED", "PAID"] } },
    select: { profileSnapshot: true },
  });
  const snaps = participants.map((p) => (p.profileSnapshot as Record<string, unknown>) ?? {});
  const rawQuotas = (mission.quotas as any[] | null) ?? [];
  const quotaBreakdown = rawQuotas.map((q: any) => {
    const filled = snaps.filter((s) => s[q.dimension] === q.value).length;
    return {
      dimension: q.dimension,
      value: q.value,
      target: q.target,
      filled,
      remaining: Math.max(0, q.target - filled),
      percentFilled: q.target > 0 ? Math.round((filled / q.target) * 100) : 100,
    };
  });

  // 5. Detect and persist anomalies
  await detectAndPersistAnomalies(missionId, metrics);

  const openAnomalies = await prisma.researchAnomaly.findMany({
    where: { missionId, status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // 6. Calculate Health Score & Alerts
  const healthScore = calculateResearchHealthScore(metrics, quotaBreakdown, openAnomalies.length);
  const alerts = evaluateDeterministicAlerts(metrics, quotaBreakdown, mission.expiresAt);

  // 7. Generate Sanitized AI Insights
  const sanitizedData = sanitizeMetricsForAi(metrics, quotaBreakdown);
  const aiInsight = await generateAiInsightAndProposals(missionId, sanitizedData);

  // 8. Persist AI recommendations as PENDING
  await persistRecommendations(missionId, aiInsight.recommendations);

  const pendingRecommendations = await prisma.researchRecommendation.findMany({
    where: { missionId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const result = {
    metrics,
    healthScore,
    alerts,
    anomalies: openAnomalies,
    recommendations: pendingRecommendations,
    aiInsight: {
      summary: aiInsight.summary,
      findings: aiInsight.findings,
      confidence: aiInsight.confidence,
      severity: aiInsight.severity,
    },
    updatedAt: new Date().toISOString(),
  };

  intelligenceCache.set(missionId, { timestamp: Date.now(), data: result });
  return result;
}
