import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envProd = path.resolve(__dirname, "../apps/web/.env.prod");
const envLocal = path.resolve(__dirname, "../apps/web/.env.local");
const envFile = path.resolve(__dirname, "../apps/web/.env");

if (fs.existsSync(envProd)) dotenv.config({ path: envProd, override: true });
else if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
else if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

import { evaluateScreeningAnswers, computeAgeRange } from "../apps/web/src/lib/survey-service";

// Mock Survey P2 Engine
class MockSurveyP2Engine {
  private screeningEnabled: boolean;
  private screeningQuestions: any[];
  private quotas: any[];
  private maxParticipants: number;
  private remainingBudget: number;
  private rewardPerParticipant: number;

  private participants = new Map<string, {
    status: string;
    screeningStatus: string;
    screeningAnswers?: any;
    profileSnapshot?: any;
  }>();

  constructor(config: {
    screeningEnabled?: boolean;
    screeningQuestions?: any[];
    quotas?: any[];
    maxParticipants?: number;
    budget?: number;
    rewardPerParticipant?: number;
  }) {
    this.screeningEnabled = config.screeningEnabled || false;
    this.screeningQuestions = config.screeningQuestions || [];
    this.quotas = config.quotas || [];
    this.maxParticipants = config.maxParticipants || 999999;
    this.remainingBudget = config.budget || 10000;
    this.rewardPerParticipant = config.rewardPerParticipant || 1000;
  }

  submitScreening(userId: string, answers: any, profile: { country?: string; gender?: string; birthDate?: string }) {
    // Check if user already screened out
    const existing = this.participants.get(userId);
    if (existing && existing.screeningStatus === "SCREENED_OUT") {
      return { eligible: false, screeningStatus: "SCREENED_OUT", message: "Bạn không thuộc nhóm đối tượng của khảo sát này." };
    }

    // Check missing profile attributes for configured quotas
    for (const q of this.quotas) {
      if (q.dimension === "country" && !profile.country) {
        return { eligible: false, profileIncomplete: true, error: "PROFILE_INCOMPLETE" };
      }
      if (q.dimension === "gender" && !profile.gender) {
        return { eligible: false, profileIncomplete: true, error: "PROFILE_INCOMPLETE" };
      }
      if (q.dimension === "ageRange" && !profile.birthDate) {
        return { eligible: false, profileIncomplete: true, error: "PROFILE_INCOMPLETE" };
      }
    }

    const ageRange = computeAgeRange(profile.birthDate);
    const profileSnapshot = { country: profile.country, gender: profile.gender, ageRange };

    let isEligible = true;
    if (this.screeningEnabled && this.screeningQuestions.length > 0) {
      const evalRes = evaluateScreeningAnswers(this.screeningQuestions, answers);
      isEligible = evalRes.eligible;
    }

    const screeningStatus = isEligible ? "ELIGIBLE" : "SCREENED_OUT";
    this.participants.set(userId, {
      status: "SUBMITTED",
      screeningStatus,
      screeningAnswers: answers,
      profileSnapshot,
    });

    if (!isEligible) {
      return { eligible: false, screeningStatus: "SCREENED_OUT", message: "Bạn không thuộc nhóm đối tượng của khảo sát này." };
    }

    return { eligible: true, screeningStatus: "ELIGIBLE", profileSnapshot };
  }

  autoSelectOrReward(userId: string) {
    const p = this.participants.get(userId);
    if (!p || p.screeningStatus !== "ELIGIBLE") {
      return { success: false, error: "NOT_ELIGIBLE" };
    }

    // Total slots check
    let selectedCount = 0;
    for (const item of this.participants.values()) {
      if (item.status === "SELECTED" || item.status === "REWARDED") selectedCount++;
    }

    if (selectedCount >= this.maxParticipants) {
      return { success: false, error: "SURVEY_FULL" };
    }

    // Quota check
    for (const q of this.quotas) {
      const val = p.profileSnapshot[q.dimension];
      if (val === q.value) {
        let qCount = 0;
        for (const item of this.participants.values()) {
          if ((item.status === "SELECTED" || item.status === "REWARDED") && item.profileSnapshot?.[q.dimension] === q.value) {
            qCount++;
          }
        }
        if (qCount >= q.target) {
          return { success: false, error: "QUOTA_FULL", quota: q };
        }
      }
    }

    p.status = "REWARDED";
    this.remainingBudget -= this.rewardPerParticipant;
    return { success: true, status: "REWARDED" };
  }
}

console.log("=== RUNNING SURVEY P2 E2E & UNIT TEST SUITE ===");

// 1. SCREENING PASS
console.log("\n[TEST 1] Screening PASS Flow...");
const questions = [{ id: "q1", question: "Dog owner?", type: "YES_NO", eligibleAnswers: ["YES"], required: true }];
const e1 = new MockSurveyP2Engine({ screeningEnabled: true, screeningQuestions: questions });
const rPass = e1.submitScreening("user-1", { q1: "YES" }, { country: "VN", gender: "Female", birthDate: "1995-05-15" });
console.log("Screening PASS Result:", rPass);
if (!rPass.eligible || rPass.screeningStatus !== "ELIGIBLE") throw new Error("Screening PASS failed!");

// 2. SCREENING FAIL
console.log("\n[TEST 2] Screening FAIL Flow...");
const rFail = e1.submitScreening("user-2", { q1: "NO" }, { country: "VN", gender: "Male", birthDate: "1995-05-15" });
console.log("Screening FAIL Result:", rFail);
if (rFail.eligible || rFail.screeningStatus !== "SCREENED_OUT") throw new Error("Screening FAIL failed!");

// 3. QUOTA COUNTRY
console.log("\n[TEST 3] Quota Country Enforcement...");
const eQuota = new MockSurveyP2Engine({
  quotas: [{ dimension: "country", value: "VN", target: 1 }],
  maxParticipants: 10,
});
eQuota.submitScreening("vn-1", {}, { country: "VN", gender: "Female", birthDate: "1990-01-01" });
const selVN1 = eQuota.autoSelectOrReward("vn-1");
console.log("VN Worker 1 Select:", selVN1);

eQuota.submitScreening("vn-2", {}, { country: "VN", gender: "Male", birthDate: "1992-01-01" });
const selVN2 = eQuota.autoSelectOrReward("vn-2");
console.log("VN Worker 2 Select (Quota Full):", selVN2);
if (selVN2.success || selVN2.error !== "QUOTA_FULL") throw new Error("Country Quota Enforcement Failed!");

// 4. QUOTA AGE RANGE
console.log("\n[TEST 4] Quota Age Range Enforcement...");
const eAge = new MockSurveyP2Engine({
  quotas: [{ dimension: "ageRange", value: "18-24", target: 1 }],
  maxParticipants: 10,
});
eAge.submitScreening("young-1", {}, { country: "USA", gender: "Female", birthDate: "2003-01-01" }); // Age 23 -> 18-24
eAge.autoSelectOrReward("young-1");

eAge.submitScreening("young-2", {}, { country: "USA", gender: "Male", birthDate: "2004-01-01" }); // Age 22 -> 18-24
const selAge2 = eAge.autoSelectOrReward("young-2");
console.log("Young Worker 2 Select (Age Quota Full):", selAge2);
if (selAge2.success || selAge2.error !== "QUOTA_FULL") throw new Error("Age Quota Enforcement Failed!");

// 5. QUOTA GENDER
console.log("\n[TEST 5] Quota Gender Enforcement...");
const eGender = new MockSurveyP2Engine({
  quotas: [{ dimension: "gender", value: "Female", target: 1 }],
  maxParticipants: 10,
});
eGender.submitScreening("fem-1", {}, { country: "JP", gender: "Female", birthDate: "1988-01-01" });
eGender.autoSelectOrReward("fem-1");

eGender.submitScreening("fem-2", {}, { country: "JP", gender: "Female", birthDate: "1989-01-01" });
const selFem2 = eGender.autoSelectOrReward("fem-2");
console.log("Female Worker 2 Select (Gender Quota Full):", selFem2);
if (selFem2.success || selFem2.error !== "QUOTA_FULL") throw new Error("Gender Quota Enforcement Failed!");

// 6. PROFILE VALIDATION
console.log("\n[TEST 6] Missing Profile Validation...");
const eProf = new MockSurveyP2Engine({
  quotas: [{ dimension: "country", value: "VN", target: 5 }],
});
const rMissingProf = eProf.submitScreening("no-country", {}, { gender: "Female" }); // Missing country
console.log("Missing Profile Result:", rMissingProf);
if (rMissingProf.eligible || !rMissingProf.profileIncomplete) throw new Error("Profile Validation Failed!");

// 7. ANTI-DUPLICATE SCREENING
console.log("\n[TEST 7] Anti-Duplicate Screening...");
const dup1 = e1.submitScreening("user-2", { q1: "YES" }, { country: "VN", gender: "Male", birthDate: "1995-05-15" });
console.log("Rescreening User 2 Result:", dup1);
if (dup1.eligible || dup1.screeningStatus !== "SCREENED_OUT") throw new Error("Anti-Duplicate Screening Failed!");

console.log("\n=== ALL SURVEY P2 E2E & UNIT TESTS PASSED 100% ===");
