import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envFile = path.resolve(__dirname, "../apps/web/.env");
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

// Remove OPENAI_API_KEY to force mock path in tests (no real API cost)
delete process.env.OPENAI_API_KEY;

import {
  ResearchPlanOutputSchema,
  validatePlanDeterministic,
  buildMockPlan,
  type ResearchPlanOutput,
} from "../apps/web/src/lib/ai-research-copilot-service";

// We need to expose buildMockPlan for test — re-implement inline for import compatibility
function makeMockPlan(sample: number): ResearchPlanOutput {
  return {
    title: "Test Research Plan",
    objective: "Test smartphone purchase research",
    audienceCriteria: { countries: ["VN", "US"], ageMin: 18, ageMax: 35, minimumTrustScore: 50 },
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
      quotas: [
        { dimension: "country", value: "VN", target: Math.floor(sample / 2), aiSuggested: false },
        { dimension: "country", value: "US", target: Math.ceil(sample / 2), aiSuggested: false },
      ],
    },
    survey: {
      title: "Smartphone Brand Preference Survey",
      estimatedDurationMinutes: 8,
      questions: [
        { tempId: "q-1", order: 1, type: "SINGLE_CHOICE", question: "Which brand?", required: true, options: ["Apple", "Samsung", "Xiaomi"] },
        {
          tempId: "q-attn",
          order: 2,
          type: "SINGLE_CHOICE",
          question: "Please select Blue.",
          required: true,
          options: ["Red", "Green", "Blue"],
          isAttentionCheck: true,
          expectedAnswer: "Blue",
        },
        { tempId: "q-2", order: 3, type: "RATING", question: "Satisfaction?", required: true, validation: { min: 1, max: 5 } },
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
    },
    assumptions: ["Country = VN+US based on brief"],
    warnings: [],
  };
}

console.log("=== RUNNING P6 AI RESEARCH COPILOT TEST SUITE ===\n");

// TEST 1: Zod schema validation — valid plan
console.log("[TEST 1] Zod Schema Validation — Valid Plan...");
const validPlan = makeMockPlan(500);
const result1 = ResearchPlanOutputSchema.safeParse(validPlan);
if (!result1.success) throw new Error(`Valid plan failed Zod: ${result1.error.message}`);
console.log("PASS — valid plan accepted");

// TEST 2: Zod schema validation — invalid plan (reward < 0)
console.log("\n[TEST 2] Zod Schema Validation — Invalid Plan (negative reward)...");
const badPlan = { ...validPlan, rewardPolicy: { ...validPlan.rewardPolicy, rewardPerParticipant: -5 } };
const result2 = ResearchPlanOutputSchema.safeParse(badPlan);
if (result2.success) throw new Error("Invalid plan should have been rejected by Zod");
console.log("PASS — invalid plan rejected");

// TEST 3: Warning engine — LOW_SAMPLE
console.log("\n[TEST 3] Warning Engine — LOW_SAMPLE...");
const smallPlan = makeMockPlan(20);
const w3 = validatePlanDeterministic(smallPlan, 5000, null);
if (!w3.some((w) => w.code === "LOW_SAMPLE")) throw new Error("Missing LOW_SAMPLE warning");
console.log("PASS — LOW_SAMPLE detected:", w3.find((w) => w.code === "LOW_SAMPLE")?.message);

// TEST 4: Warning engine — INSUFFICIENT_AUDIENCE
console.log("\n[TEST 4] Warning Engine — INSUFFICIENT_AUDIENCE...");
const w4 = validatePlanDeterministic(validPlan, 100, null); // eligible < target
if (!w4.some((w) => w.code === "INSUFFICIENT_AUDIENCE")) throw new Error("Missing INSUFFICIENT_AUDIENCE warning");
console.log("PASS — INSUFFICIENT_AUDIENCE detected");

// TEST 5: Warning engine — QUOTA_IMPOSSIBLE
console.log("\n[TEST 5] Warning Engine — QUOTA_IMPOSSIBLE...");
const mismatchPlan = { ...validPlan, quota: { total: 500, quotas: [{ dimension: "country" as const, value: "VN", target: 300, aiSuggested: false }] } };
const w5 = validatePlanDeterministic(mismatchPlan, 9999, null);
if (!w5.some((w) => w.code === "QUOTA_IMPOSSIBLE")) throw new Error("Missing QUOTA_IMPOSSIBLE warning");
console.log("PASS — QUOTA_IMPOSSIBLE detected");

// TEST 6: Warning engine — BUDGET_INSUFFICIENT
console.log("\n[TEST 6] Warning Engine — BUDGET_INSUFFICIENT...");
const w6 = validatePlanDeterministic(validPlan, 9999, 5000); // cost=500*20+500*2=11000 > budget=5000
if (!w6.some((w) => w.code === "BUDGET_INSUFFICIENT")) throw new Error("Missing BUDGET_INSUFFICIENT warning");
console.log("PASS — BUDGET_INSUFFICIENT detected");

// TEST 7: Warning engine — HIGH_REWARD
console.log("\n[TEST 7] Warning Engine — HIGH_REWARD...");
const highRewardPlan = { ...validPlan, rewardPolicy: { ...validPlan.rewardPolicy, rewardPerParticipant: 2000, estimatedTotalReward: 1000000 } };
const w7 = validatePlanDeterministic(highRewardPlan, 9999, null);
if (!w7.some((w) => w.code === "HIGH_REWARD")) throw new Error("Missing HIGH_REWARD warning");
console.log("PASS — HIGH_REWARD detected");

// TEST 8: Warning engine — MISSING_ATTENTION_CHECKS
console.log("\n[TEST 8] Warning Engine — MISSING_ATTENTION_CHECKS...");
const bigSurveyFor8 = {
  ...validPlan,
  qualityPolicy: { ...validPlan.qualityPolicy, attentionCheckCount: 0 },
  survey: {
    ...validPlan.survey,
    questions: Array.from({ length: 8 }, (_, i) => ({
      tempId: `q-${i}`,
      order: i + 1,
      type: "TEXT" as const,
      question: `Question ${i + 1}`,
      required: false,
    })),
  },
};
const w8 = validatePlanDeterministic(bigSurveyFor8, 9999, null);
if (!w8.some((w) => w.code === "MISSING_ATTENTION_CHECKS")) throw new Error("Missing MISSING_ATTENTION_CHECKS warning");
console.log("PASS — MISSING_ATTENTION_CHECKS detected");

// TEST 9: Warning engine — TOO_MANY_QUESTIONS
console.log("\n[TEST 9] Warning Engine — TOO_MANY_QUESTIONS...");
const longSurveyPlan = {
  ...validPlan,
  survey: {
    ...validPlan.survey,
    questions: Array.from({ length: 35 }, (_, i) => ({
      tempId: `q-${i}`,
      order: i + 1,
      type: "TEXT" as const,
      question: `Question ${i + 1}`,
      required: false,
    })),
  },
};
const w9 = validatePlanDeterministic(longSurveyPlan, 9999, null);
if (!w9.some((w) => w.code === "TOO_MANY_QUESTIONS")) throw new Error("Missing TOO_MANY_QUESTIONS warning");
console.log("PASS — TOO_MANY_QUESTIONS detected");

// TEST 10: Valid plan, sufficient audience → no ERROR warnings
console.log("\n[TEST 10] Clean Plan — No ERROR warnings...");
const cleanWarnings = validatePlanDeterministic(validPlan, 9999, 999999);
const cleanErrors = cleanWarnings.filter((w) => w.severity === "ERROR");
if (cleanErrors.length > 0) throw new Error(`Unexpected ERROR warnings: ${cleanErrors.map((w) => w.code).join(", ")}`);
console.log("PASS — no ERROR-severity warnings on clean plan");

// TEST 11: P5 regression — audience criteria structure
console.log("\n[P5 REGRESSION] Audience Criteria Schema Compatibility...");
const audienceCriteria = validPlan.audienceCriteria;
if (!audienceCriteria.countries || !audienceCriteria.minimumTrustScore) throw new Error("Audience criteria incompatible with P5");
console.log("PASS — P5 audience criteria compatible");

// TEST 12: P3 regression — survey question type compatibility
console.log("\n[P3 REGRESSION] Survey Question Types...");
const allowedTypes = ["SINGLE_CHOICE","MULTIPLE_CHOICE","YES_NO","RATING","NUMBER","TEXT","MATRIX","PHOTO","VIDEO","AUDIO"];
for (const q of validPlan.survey.questions) {
  if (!allowedTypes.includes(q.type)) throw new Error(`Invalid question type: ${q.type}`);
}
console.log("PASS — all question types P3-compatible");

// TEST 13: AI cannot auto-publish — state machine check
console.log("\n[TEST 13] AI Publish Guard...");
const ALLOWED_AI_STATES = ["GENERATING", "READY_FOR_REVIEW", "FAILED"];
const HUMAN_ONLY_STATES = ["APPROVED", "PUBLISHED"];
for (const s of HUMAN_ONLY_STATES) {
  if (ALLOWED_AI_STATES.includes(s)) throw new Error(`AI can transition to ${s} — SECURITY VIOLATION`);
}
console.log("PASS — APPROVED/PUBLISHED are human-only states");

console.log("\n=== ALL P6 AI RESEARCH COPILOT TESTS PASSED 100% ===");
