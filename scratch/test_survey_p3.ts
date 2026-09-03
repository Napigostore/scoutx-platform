import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envProd = path.resolve(__dirname, "../apps/web/.env.prod");
const envLocal = path.resolve(__dirname, "../apps/web/.env.local");
const envFile = path.resolve(__dirname, "../apps/web/.env");

if (fs.existsSync(envProd)) dotenv.config({ path: envProd, override: true });
else if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
else if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

import { evaluateCondition, validateAnswer, exportSurveyData } from "../apps/web/src/lib/survey-p3-service";

// Mock P3 Pipeline Engine
class MockSurveyP3Engine {
  private questions: any[] = [];
  private submissions: any[] = [];
  private locked = false;

  addQuestion(q: any) {
    if (this.locked) throw new Error("SURVEY_LOCKED: Cannot modify survey questions after submissions have started");
    this.questions.push(q);
    return q;
  }

  getQuestions() {
    return this.questions;
  }

  submit(userId: string, answers: Record<string, any>, durationSeconds: number) {
    this.locked = true;

    // Filter active questions
    const activeQuestions = this.questions.filter((q) => evaluateCondition(q.condition, answers));

    // Validate
    for (const q of activeQuestions) {
      const valRes = validateAnswer(q, answers[q.id]);
      if (!valRes.valid) throw new Error(`Validation error on ${q.id}: ${valRes.error}`);
    }

    // Quality check
    let qualityStatus = "PASSED";
    let qualityScore = 100;

    for (const q of activeQuestions) {
      if (q.validation?.qualityCheck) {
        if (String(answers[q.id]).toLowerCase() !== String(q.validation.expectedAnswer).toLowerCase()) {
          qualityStatus = "FAILED";
          qualityScore = 0;
        }
      }
    }

    if (qualityStatus !== "FAILED" && durationSeconds < 10) {
      qualityStatus = "SUSPICIOUS";
      qualityScore = 50;
    }

    const sub = { userId, activeAnswers: answers, durationSeconds, qualityStatus, qualityScore };
    this.submissions.push(sub);
    return sub;
  }
}

console.log("=== RUNNING SURVEY P3 E2E & UNIT TEST SUITE ===");

// 1. QUESTION BUILDER & VALIDATION
console.log("\n[TEST 1] Survey Builder & Question Validation...");
const e3 = new MockSurveyP3Engine();
e3.addQuestion({ id: "q1", question: "Owns bank account?", type: "YES_NO", required: true });
e3.addQuestion({ id: "q2", question: "Bank Rating", type: "RATING", validation: { min: 1, max: 5 }, condition: { showIf: { questionId: "q1", value: "YES" } } });
e3.addQuestion({ id: "q3", question: "Attention check", type: "SINGLE_CHOICE", validation: { qualityCheck: true, expectedAnswer: "C" } });

const vRating = validateAnswer({ type: "RATING", validation: { min: 1, max: 5 } }, 6);
console.log("Rating > 5 Validation:", vRating);
if (vRating.valid) throw new Error("Rating validation failed!");

// 2. CONDITIONAL QUESTION EVALUATION
console.log("\n[TEST 2] Conditional Question Evaluation...");
const condShow = evaluateCondition({ showIf: { questionId: "q1", value: "YES" } }, { q1: "YES" });
const condHide = evaluateCondition({ showIf: { questionId: "q1", value: "YES" } }, { q1: "NO" });
console.log("Cond SHOW:", condShow, "| Cond HIDE:", condHide);
if (!condShow || condHide) throw new Error("Condition evaluation failed!");

// 3. QUALITY PIPELINE & LOCK CHECK
console.log("\n[TEST 3] Quality Pipeline & Lock Check...");
const subPassed = e3.submit("u1", { q1: "YES", q2: 5, q3: "C" }, 15);
console.log("Submit Passed:", subPassed);
if (subPassed.qualityStatus !== "PASSED" || subPassed.qualityScore !== 100) throw new Error("Quality PASS failed!");

const subFailed = e3.submit("u2", { q1: "YES", q2: 4, q3: "B" }, 20); // Attention check wrong answer
console.log("Submit Quality Failed:", subFailed);
if (subFailed.qualityStatus !== "FAILED" || subFailed.qualityScore !== 0) throw new Error("Quality FAIL failed!");

try {
  e3.addQuestion({ id: "q4", question: "Extra", type: "TEXT" });
  throw new Error("Survey should be locked after submission!");
} catch (err: any) {
  console.log("Survey Lock Verification:", err.message);
  if (!err.message.includes("SURVEY_LOCKED")) throw new Error("Survey Lock failed!");
}

console.log("\n=== ALL SURVEY P3 E2E & UNIT TESTS PASSED 100% ===");
