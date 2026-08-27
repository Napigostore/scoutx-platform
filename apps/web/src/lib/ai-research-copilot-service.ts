/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Research Copilot Service — P6
 *
 * Uses OpenAI GPT (env: OPENAI_API_KEY) to generate structured research plans.
 * Falls back to a deterministic mock plan when no API key is configured
 * (useful in test/dev environments).
 *
 * NEVER logs PII. Structured output only — validated by Zod server-side.
 * AI CANNOT publish, spend coins, or modify missions.
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { estimateAudienceSize } from "@/lib/audience-panel-service";

// ---------------------------------------------------------------------------
// Zod schema — strict structural validation for AI output
// ---------------------------------------------------------------------------

const AudienceCriteriaSchema = z.object({
  countries: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  ageMin: z.number().int().min(13).max(99).optional(),
  ageMax: z.number().int().min(13).max(99).optional(),
  genders: z.array(z.string()).optional(),
  employmentStatuses: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  jobTitles: z.array(z.string()).optional(),
  educations: z.array(z.string()).optional(),
  deviceTypes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  productUsage: z.array(z.string()).optional(),
  purchaseBehavior: z.array(z.string()).optional(),
  minimumTrustScore: z.number().int().min(0).max(100).optional(),
  minimumQualityScore: z.number().int().min(0).max(100).optional(),
  minimumCompletedMissions: z.number().int().min(0).optional(),
  verifiedOnly: z.boolean().optional(),
});

const ScreeningQuestionSchema = z.object({
  tempId: z.string(),
  order: z.number().int().min(1),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "YES_NO", "NUMBER", "TEXT"]),
  question: z.string().min(1).max(500),
  description: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  isEliminationQuestion: z.boolean().optional(),
  eliminationAnswer: z.string().optional(),
});

const QuotaSchema = z.object({
  dimension: z.enum(["country", "gender", "ageRange", "industry", "ai_suggested"]),
  value: z.string(),
  target: z.number().int().min(1),
  aiSuggested: z.boolean().optional(),
});

const SurveyQuestionSchema = z.object({
  tempId: z.string(),
  order: z.number().int().min(1),
  type: z.enum([
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "YES_NO",
    "RATING",
    "NUMBER",
    "TEXT",
    "MATRIX",
    "PHOTO",
    "VIDEO",
    "AUDIO",
  ]),
  question: z.string().min(1).max(1000),
  description: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
    })
    .optional(),
  condition: z
    .object({
      dependsOn: z.string(),
      operator: z.enum(["equals", "not_equals", "contains"]),
      value: z.string(),
    })
    .optional(),
  isAttentionCheck: z.boolean().optional(),
  expectedAnswer: z.string().optional(),
});

const QualityPolicySchema = z.object({
  minimumDurationSeconds: z.number().int().min(0),
  attentionCheckCount: z.number().int().min(0).max(5),
  qualityScoreThreshold: z.number().int().min(0).max(100).optional(),
  speedTrapEnabled: z.boolean().optional(),
  duplicateIpCheck: z.boolean().optional(),
});

const RewardPolicySchema = z.object({
  rewardPerParticipant: z.number().min(0),
  estimatedTotalReward: z.number().min(0),
  estimatedPlatformFee: z.number().min(0),
  currency: z.string().default("COIN"),
  aiSuggestedRationale: z.string().optional(),
});

export const ResearchPlanOutputSchema = z.object({
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(2000),
  audienceCriteria: AudienceCriteriaSchema,
  screening: z.object({
    enabled: z.boolean(),
    questions: z.array(ScreeningQuestionSchema),
  }),
  quota: z.object({
    total: z.number().int().min(1),
    quotas: z.array(QuotaSchema),
  }),
  survey: z.object({
    title: z.string(),
    estimatedDurationMinutes: z.number().min(1),
    questions: z.array(SurveyQuestionSchema),
  }),
  qualityPolicy: QualityPolicySchema,
  rewardPolicy: RewardPolicySchema,
  assumptions: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ResearchPlanOutput = z.infer<typeof ResearchPlanOutputSchema>;

// ---------------------------------------------------------------------------
// Warning engine — deterministic, runs AFTER AI validation
// ---------------------------------------------------------------------------

export type PlanWarning = {
  code: string;
  message: string;
  severity: "INFO" | "WARNING" | "ERROR";
};

export function validatePlanDeterministic(
  plan: ResearchPlanOutput,
  eligibleCount: number,
  budget?: number | null,
): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const { quota, survey, qualityPolicy, rewardPolicy } = plan;

  if (quota.total < 30) {
    warnings.push({
      code: "LOW_SAMPLE",
      message: `Sample size ${quota.total} is below 30 — statistical power may be insufficient.`,
      severity: "WARNING",
    });
  }

  if (eligibleCount < quota.total) {
    warnings.push({
      code: "INSUFFICIENT_AUDIENCE",
      message: `Eligible audience (${eligibleCount}) is smaller than target sample (${quota.total}).`,
      severity: "ERROR",
    });
  }

  if (eligibleCount > 0 && eligibleCount < quota.total * 2) {
    warnings.push({
      code: "AUDIENCE_TOO_TIGHT",
      message: `Eligible pool (${eligibleCount}) is less than 2× sample size — completion rate risk.`,
      severity: "WARNING",
    });
  }

  const totalQuotaTarget = quota.quotas.reduce((s, q) => s + q.target, 0);
  if (quota.quotas.length > 0 && totalQuotaTarget !== quota.total) {
    warnings.push({
      code: "QUOTA_IMPOSSIBLE",
      message: `Quota breakdown sum (${totalQuotaTarget}) does not match target sample (${quota.total}).`,
      severity: "ERROR",
    });
  }

  if (quota.quotas.some((q) => q.aiSuggested)) {
    warnings.push({
      code: "AI_SUGGESTED_QUOTA",
      message: "Some quotas were AI-suggested. Please review before approving.",
      severity: "INFO",
    });
  }

  if (survey.questions.length > 30) {
    warnings.push({
      code: "TOO_MANY_QUESTIONS",
      message: `Survey has ${survey.questions.length} questions — consider reducing to < 30.`,
      severity: "WARNING",
    });
  }

  if (survey.estimatedDurationMinutes > 20) {
    warnings.push({
      code: "SURVEY_TOO_LONG",
      message: `Estimated duration ${survey.estimatedDurationMinutes} min exceeds 20 min — completion rates will drop.`,
      severity: "WARNING",
    });
  }

  if (qualityPolicy.attentionCheckCount === 0 && survey.questions.length > 5) {
    warnings.push({
      code: "MISSING_ATTENTION_CHECKS",
      message: "No attention checks configured. Recommend ≥1 for data quality.",
      severity: "WARNING",
    });
  }

  if (qualityPolicy.minimumDurationSeconds > survey.estimatedDurationMinutes * 60 * 0.9) {
    warnings.push({
      code: "DURATION_TOO_STRICT",
      message:
        "Minimum duration is close to estimated duration — may reject genuine fast respondents.",
      severity: "WARNING",
    });
  }

  if (rewardPolicy.rewardPerParticipant <= 0) {
    warnings.push({
      code: "LOW_REWARD",
      message: "Reward per participant is zero or negative.",
      severity: "ERROR",
    });
  }

  if (rewardPolicy.rewardPerParticipant > 1000) {
    warnings.push({
      code: "HIGH_REWARD",
      message: `Reward per participant (${rewardPolicy.rewardPerParticipant} coins) is unusually high.`,
      severity: "WARNING",
    });
  }

  const estimatedTotal = rewardPolicy.estimatedTotalReward + rewardPolicy.estimatedPlatformFee;
  if (budget != null && estimatedTotal > budget) {
    warnings.push({
      code: "BUDGET_INSUFFICIENT",
      message: `Estimated cost (${estimatedTotal.toFixed(2)}) exceeds budget (${budget}).`,
      severity: "ERROR",
    });
  }

  const screeningQuestions = plan.screening.questions;
  const requiredScreeningAnswers = screeningQuestions.filter((q) => q.isEliminationQuestion);
  if (requiredScreeningAnswers.length > 5) {
    warnings.push({
      code: "SCREENING_TOO_STRICT",
      message: `${requiredScreeningAnswers.length} elimination screening questions — may reduce eligible pool too aggressively.`,
      severity: "WARNING",
    });
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// AI Provider — OpenAI (env: OPENAI_API_KEY)
// Falls back to mock plan in dev/test when key is missing
// ---------------------------------------------------------------------------

const AI_MODEL = "gpt-4o-mini";
const AI_VERSION = "2024-07-18";

const SYSTEM_PROMPT = `You are an expert market research planner for ScoutX, a research platform.
Given a research brief in any language, produce a STRICTLY structured JSON research plan.

RULES:
- ONLY output valid JSON. No markdown, no prose, no code blocks.
- Do NOT invent impossible audience criteria.
- Do NOT suggest rewardPerParticipant above 500 coins without explicit user instruction.
- Do NOT set minimumDurationSeconds to 0 if survey has questions.
- Attention checks must only be YES_NO or SINGLE_CHOICE type with explicit expectedAnswer.
- If the user mentions specific country splits (e.g. "250 Vietnam, 250 USA"), use exact quotas and set aiSuggested=false.
- If no split is mentioned, propose quotas and mark aiSuggested=true.
- Warn if criteria conflict or are too narrow.
- Assumptions array MUST document any inference you made from incomplete input.
- The JSON schema is fixed. Do not add extra top-level keys.

OUTPUT SCHEMA (exact, no extra keys):
{
  "title": string,
  "objective": string,
  "audienceCriteria": { countries?, regions?, languages?, ageMin?, ageMax?, genders?, employmentStatuses?, industries?, jobTitles?, educations?, deviceTypes?, skills?, interests?, productUsage?, purchaseBehavior?, minimumTrustScore?, minimumQualityScore?, minimumCompletedMissions?, verifiedOnly? },
  "screening": { "enabled": boolean, "questions": [{ tempId, order, type, question, description?, required, options?, isEliminationQuestion?, eliminationAnswer? }] },
  "quota": { "total": number, "quotas": [{ dimension, value, target, aiSuggested? }] },
  "survey": { "title": string, "estimatedDurationMinutes": number, "questions": [{ tempId, order, type, question, description?, required, options?, validation?, condition?, isAttentionCheck?, expectedAnswer? }] },
  "qualityPolicy": { "minimumDurationSeconds": number, "attentionCheckCount": number, "qualityScoreThreshold"?, "speedTrapEnabled"?, "duplicateIpCheck"? },
  "rewardPolicy": { "rewardPerParticipant": number, "estimatedTotalReward": number, "estimatedPlatformFee": number, "currency": "COIN", "aiSuggestedRationale"? },
  "assumptions": [string],
  "warnings": [string]
}`;

async function callOpenAI(
  rawBrief: string,
): Promise<{ raw: string; model: string; version: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawBrief },
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return { raw: content, model: AI_MODEL, version: AI_VERSION };
}

export function buildMockPlan(rawBrief: string, targetSampleSize?: number): ResearchPlanOutput {
  const sample = targetSampleSize ?? 100;
  return {
    title: "Research Plan (Draft)",
    objective: rawBrief.slice(0, 200),
    audienceCriteria: { countries: ["VN"], minimumTrustScore: 50 },
    screening: {
      enabled: true,
      questions: [
        {
          tempId: "sq-1",
          order: 1,
          type: "YES_NO",
          question: "Have you purchased a smartphone in the last 12 months?",
          required: true,
          isEliminationQuestion: true,
          eliminationAnswer: "No",
        },
      ],
    },
    quota: {
      total: sample,
      quotas: [{ dimension: "country", value: "VN", target: sample, aiSuggested: false }],
    },
    survey: {
      title: "Consumer Research Survey",
      estimatedDurationMinutes: 8,
      questions: [
        {
          tempId: "q-1",
          order: 1,
          type: "SINGLE_CHOICE",
          question: "Which brand did you purchase?",
          required: true,
          options: ["Apple", "Samsung", "Xiaomi", "Other"],
        },
        {
          tempId: "q-attn",
          order: 2,
          type: "SINGLE_CHOICE",
          question: "Attention check: Please select 'Blue' to continue.",
          required: true,
          options: ["Red", "Green", "Blue", "Yellow"],
          isAttentionCheck: true,
          expectedAnswer: "Blue",
        },
        {
          tempId: "q-2",
          order: 3,
          type: "RATING",
          question: "How satisfied are you with your purchase? (1–5)",
          required: true,
          validation: { min: 1, max: 5 },
        },
      ],
    },
    qualityPolicy: {
      minimumDurationSeconds: 120,
      attentionCheckCount: 1,
      qualityScoreThreshold: 60,
      speedTrapEnabled: true,
      duplicateIpCheck: true,
    },
    rewardPolicy: {
      rewardPerParticipant: 20,
      estimatedTotalReward: sample * 20,
      estimatedPlatformFee: sample * 20 * 0.1,
      currency: "COIN",
      aiSuggestedRationale: "Standard rate for 8-minute survey",
    },
    assumptions: [
      "Country not fully specified — defaulted to VN",
      "Sample size not specified — defaulted to 100",
    ],
    warnings: [
      "This is a mock plan generated without AI. Configure OPENAI_API_KEY for real plans.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Core service functions
// ---------------------------------------------------------------------------

export async function createResearchBrief(
  requesterId: string,
  input: {
    rawBrief: string;
    title?: string;
    objective?: string;
    market?: string;
    methodology?: string;
    targetSampleSize?: number;
    estimatedDurationMinutes?: number;
    budget?: number;
    currency?: string;
  },
) {
  return prisma.researchBrief.create({
    data: {
      requesterId,
      rawBrief: input.rawBrief,
      title: input.title ?? "Untitled Research",
      objective: input.objective ?? input.rawBrief.slice(0, 300),
      market: input.market ?? null,
      methodology: input.methodology ?? null,
      targetSampleSize: input.targetSampleSize ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
      budget: input.budget ?? null,
      currency: input.currency ?? "USD",
      status: "DRAFT",
    },
    include: { plan: true },
  });
}

export async function generateResearchPlan(
  briefId: string,
  requesterId: string,
): Promise<{ brief: any; plan: any; warnings: PlanWarning[] }> {
  // Verify ownership
  const brief = await prisma.researchBrief.findUnique({ where: { id: briefId } });
  if (!brief || brief.requesterId !== requesterId) throw new Error("Brief not found or forbidden");
  if (["PUBLISHED", "ARCHIVED"].includes(brief.status))
    throw new Error("Brief cannot be regenerated in current state");

  // Mark as generating
  await prisma.researchBrief.update({ where: { id: briefId }, data: { status: "GENERATING" } });

  let planOutput: ResearchPlanOutput;
  let aiModel: string;
  let aiVersion: string;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const result = await callOpenAI(brief.rawBrief);
      aiModel = result.model;
      aiVersion = result.version;

      let parsed: unknown;
      try {
        parsed = JSON.parse(result.raw);
      } catch {
        throw new Error("AI returned invalid JSON — cannot parse plan");
      }

      const validated = ResearchPlanOutputSchema.safeParse(parsed);
      if (!validated.success) {
        throw new Error(
          `AI output failed schema validation: ${validated.error.message.slice(0, 300)}`,
        );
      }
      planOutput = validated.data;
    } else {
      // Fallback to mock
      planOutput = buildMockPlan(brief.rawBrief, brief.targetSampleSize ?? undefined);
      aiModel = "mock";
      aiVersion = "1.0";
    }

    // Estimate audience size via P5 engine
    const eligibleCount = await estimateAudienceSize({
      countries: planOutput.audienceCriteria.countries,
      regions: planOutput.audienceCriteria.regions,
      languages: planOutput.audienceCriteria.languages,
      industries: planOutput.audienceCriteria.industries,
      employmentStatuses: planOutput.audienceCriteria.employmentStatuses,
      minimumTrustScore: planOutput.audienceCriteria.minimumTrustScore,
      minimumQualityScore: planOutput.audienceCriteria.minimumQualityScore,
    }).catch(() => 0);

    // Deterministic warnings engine
    const warnings = validatePlanDeterministic(planOutput, eligibleCount, brief.budget);

    // Upsert plan (supports regeneration)
    const plan = await prisma.researchPlan.upsert({
      where: { briefId },
      create: {
        briefId,
        audienceCriteria: planOutput.audienceCriteria as any,
        screening: planOutput.screening as any,
        quota: planOutput.quota as any,
        survey: planOutput.survey as any,
        qualityPolicy: planOutput.qualityPolicy as any,
        rewardPolicy: planOutput.rewardPolicy as any,
        estimatedEligibleCount: eligibleCount,
        estimatedCost:
          planOutput.rewardPolicy.estimatedTotalReward +
          planOutput.rewardPolicy.estimatedPlatformFee,
        warnings: warnings as any,
        aiModel,
        aiVersion,
      },
      update: {
        audienceCriteria: planOutput.audienceCriteria as any,
        screening: planOutput.screening as any,
        quota: planOutput.quota as any,
        survey: planOutput.survey as any,
        qualityPolicy: planOutput.qualityPolicy as any,
        rewardPolicy: planOutput.rewardPolicy as any,
        estimatedEligibleCount: eligibleCount,
        estimatedCost:
          planOutput.rewardPolicy.estimatedTotalReward +
          planOutput.rewardPolicy.estimatedPlatformFee,
        warnings: warnings as any,
        aiModel,
        aiVersion,
        updatedAt: new Date(),
      },
    });

    await prisma.researchBrief.update({
      where: { id: briefId },
      data: { status: "READY_FOR_REVIEW" },
    });

    const updatedBrief = await prisma.researchBrief.findUnique({
      where: { id: briefId },
      include: { plan: true },
    });
    return { brief: updatedBrief, plan, warnings };
  } catch (err) {
    await prisma.researchBrief.update({ where: { id: briefId }, data: { status: "FAILED" } });
    throw err;
  }
}

export async function getResearchBrief(briefId: string, requesterId: string) {
  const brief = await prisma.researchBrief.findUnique({
    where: { id: briefId },
    include: { plan: true },
  });
  if (!brief || brief.requesterId !== requesterId) throw new Error("Brief not found or forbidden");
  return brief;
}

export async function listResearchBriefs(requesterId: string) {
  return prisma.researchBrief.findMany({
    where: { requesterId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      plan: {
        select: {
          estimatedEligibleCount: true,
          estimatedCost: true,
          warnings: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function patchResearchBrief(
  briefId: string,
  requesterId: string,
  updates: {
    title?: string;
    objective?: string;
    market?: string;
    methodology?: string;
    targetSampleSize?: number;
    estimatedDurationMinutes?: number;
    budget?: number;
    currency?: string;
    rawBrief?: string;
  },
) {
  const brief = await prisma.researchBrief.findUnique({ where: { id: briefId } });
  if (!brief || brief.requesterId !== requesterId) throw new Error("Not found or forbidden");
  if (["PUBLISHED", "ARCHIVED"].includes(brief.status))
    throw new Error("Cannot edit published/archived brief");

  return prisma.researchBrief.update({
    where: { id: briefId },
    data: { ...updates, updatedAt: new Date() },
    include: { plan: true },
  });
}

export async function approveBrief(briefId: string, requesterId: string) {
  const brief = await prisma.researchBrief.findUnique({
    where: { id: briefId },
    include: { plan: true },
  });
  if (!brief || brief.requesterId !== requesterId) throw new Error("Not found or forbidden");
  if (brief.status !== "READY_FOR_REVIEW")
    throw new Error("Brief must be in READY_FOR_REVIEW state to approve");
  if (!brief.plan) throw new Error("Cannot approve brief without a generated plan");

  // Block approval if any ERROR-severity warning exists
  const warnings = (brief.plan.warnings as PlanWarning[] | null) ?? [];
  const errors = warnings.filter((w) => w.severity === "ERROR");
  if (errors.length > 0) {
    throw new Error(
      `Plan has blocking errors: ${errors.map((e) => e.code).join(", ")}. Fix before approving.`,
    );
  }

  return prisma.researchBrief.update({ where: { id: briefId }, data: { status: "APPROVED" } });
}

export async function publishBrief(briefId: string, requesterId: string) {
  // Human-gated: only transitions APPROVED → PUBLISHED
  // Does NOT create missions or spend coins. That is a separate action.
  const brief = await prisma.researchBrief.findUnique({ where: { id: briefId } });
  if (!brief || brief.requesterId !== requesterId) throw new Error("Not found or forbidden");
  if (brief.status !== "APPROVED") throw new Error("Brief must be APPROVED before publishing");

  return prisma.researchBrief.update({ where: { id: briefId }, data: { status: "PUBLISHED" } });
}

export async function archiveBrief(briefId: string, requesterId: string) {
  const brief = await prisma.researchBrief.findUnique({ where: { id: briefId } });
  if (!brief || brief.requesterId !== requesterId) throw new Error("Not found or forbidden");
  if (brief.status === "PUBLISHED")
    throw new Error("Cannot archive a published brief. Please close the mission first.");

  return prisma.researchBrief.update({ where: { id: briefId }, data: { status: "ARCHIVED" } });
}
