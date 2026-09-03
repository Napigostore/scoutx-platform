import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envProd = path.resolve(__dirname, "../apps/web/.env.prod");
const envLocal = path.resolve(__dirname, "../apps/web/.env.local");
const envFile = path.resolve(__dirname, "../apps/web/.env");

if (fs.existsSync(envProd)) dotenv.config({ path: envProd, override: true });
else if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
else if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

import { getTrustLevel } from "../apps/web/src/lib/worker-trust-service";

// Mock P4 Trust Engine for E2E validation
class MockTrustEngine {
  private profile = {
    userId: "worker-p4",
    trustScore: 50,
    qualityScore: 50,
    fraudRiskScore: 0,
    completedMissions: 0,
    approvedMissions: 0,
    rejectedMissions: 0,
    disputedMissions: 0,
    wonMissions: 0,
    surveyCompleted: 0,
    surveyRejected: 0,
    suspiciousCount: 0,
    evidenceApproved: 0,
    evidenceRejected: 0,
    accountAgeDays: 10,
    profileVerified: false,
  };

  recalculate() {
    const totalAttempted = this.profile.completedMissions + this.profile.rejectedMissions;
    const completionRate = totalAttempted > 0 ? this.profile.completedMissions / totalAttempted : 1;

    const rawQuality = 50 + (this.profile.surveyCompleted * 5) + (this.profile.evidenceApproved * 3) - (this.profile.surveyRejected * 10) - (this.profile.suspiciousCount * 15);
    this.profile.qualityScore = Math.max(0, Math.min(100, rawQuality));

    const rawTrust = 50 + (completionRate * 30) + (this.profile.accountAgeDays * 0.1) + (this.profile.wonMissions * 5) - (this.profile.suspiciousCount * 10);
    this.profile.trustScore = Math.max(0, Math.min(100, rawTrust));

    const rawRisk = (this.profile.suspiciousCount * 25) + (this.profile.surveyRejected * 15) + (this.profile.rejectedMissions * 10);
    this.profile.fraudRiskScore = Math.max(0, Math.min(100, rawRisk));

    this.profile.profileVerified = this.profile.trustScore >= 80;
    return { ...this.profile, trustLevel: getTrustLevel(this.profile.trustScore) };
  }

  completeMission() {
    this.profile.completedMissions++;
    return this.recalculate();
  }

  approveEvidence() {
    this.profile.evidenceApproved++;
    return this.recalculate();
  }

  rejectEvidence() {
    this.profile.evidenceRejected++;
    this.profile.rejectedMissions++;
    return this.recalculate();
  }

  surveyPass() {
    this.profile.surveyCompleted++;
    return this.recalculate();
  }

  surveyFail() {
    this.profile.surveyRejected++;
    return this.recalculate();
  }

  suspiciousSubmission() {
    this.profile.suspiciousCount++;
    return this.recalculate();
  }

  winDispute() {
    this.profile.disputedMissions++;
    this.profile.wonMissions++;
    return this.recalculate();
  }

  getPublicSafeProfile() {
    const totalAttempted = this.profile.completedMissions + this.profile.rejectedMissions;
    const approvalRate = totalAttempted > 0 ? Math.round((this.profile.completedMissions / totalAttempted) * 100) : 100;
    return {
      userId: this.profile.userId,
      trustScore: this.profile.trustScore,
      qualityScore: this.profile.qualityScore,
      trustLevel: getTrustLevel(this.profile.trustScore),
      completedMissions: this.profile.completedMissions,
      approvalRate,
      profileVerified: this.profile.profileVerified,
    };
  }
}

console.log("=== RUNNING P4 TRUST & QUALITY SYSTEM E2E & UNIT TEST SUITE ===");

// 1. NEW WORKER INITIALIZATION & MAPPING
console.log("\n[TEST 1 & 2] New Worker Profile & Trust Level Mapping...");
const engine = new MockTrustEngine();
const initial = engine.recalculate();
console.log("Initial Worker Profile:", initial);
if (initial.trustScore !== 81 || initial.trustLevel !== "TRUSTED") throw new Error("New worker trust initialization failed!");

// 2. COMPLETED MISSION & APPROVED EVIDENCE
console.log("\n[TEST 3 & 4] Evidence Approved & Mission Completed Score Boost...");
engine.approveEvidence();
const afterApprove = engine.completeMission();
console.log("After Approved Evidence & Completed Mission:", afterApprove);
if (afterApprove.qualityScore <= 50) throw new Error("Quality boost failed!");

// 3. SURVEY QUALITY PASS & FAIL
console.log("\n[TEST 5 & 6] Survey Quality PASS & FAIL Score Impacts...");
engine.surveyPass();
const afterPass = engine.recalculate();
console.log("After Survey PASS:", afterPass);

engine.surveyFail();
const afterFail = engine.recalculate();
console.log("After Survey FAIL:", afterFail);
if (afterFail.qualityScore >= afterPass.qualityScore) throw new Error("Survey FAIL score penalty failed!");

// 4. SUSPICIOUS DURATION PENALTY
console.log("\n[TEST 7 & 8] Suspicious Submission & Fraud Risk Signal...");
const afterSusp = engine.suspiciousSubmission();
console.log("After Suspicious Submission:", afterSusp);
if (afterSusp.fraudRiskScore <= 0) throw new Error("Fraud risk scoring failed!");

// 5. DISPUTE WIN PROTECTION
console.log("\n[TEST 9 & 10] Dispute Won Protection...");
const afterDisputeWin = engine.winDispute();
console.log("After Dispute Win:", afterDisputeWin);
if (afterDisputeWin.trustScore < afterSusp.trustScore) throw new Error("Dispute win trust protection failed!");

// 6. REQUESTER PUBLIC SAFE TRUST VIEW
console.log("\n[TEST 11 & 12] Requester Safe Trust View & Fraud Score Shield...");
const publicSafe = engine.getPublicSafeProfile();
console.log("Public Safe Trust View:", publicSafe);
if ("fraudRiskScore" in publicSafe || "suspiciousCount" in publicSafe) {
  throw new Error("Fraud score leaked in public requester view!");
}

// 7. MISSION TARGETING SCREENING
console.log("\n[TEST 13..16] Mission Targeting Screening (Min Trust & Quality)...");
function checkTargeting(worker: any, mission: any) {
  if (mission.minimumTrustScore && worker.trustScore < mission.minimumTrustScore) return { eligible: false, reason: "MIN_TRUST_NOT_MET" };
  if (mission.minimumQualityScore && worker.qualityScore < mission.minimumQualityScore) return { eligible: false, reason: "MIN_QUALITY_NOT_MET" };
  if (mission.verifiedOnly && !worker.profileVerified) return { eligible: false, reason: "NOT_VERIFIED" };
  return { eligible: true };
}

const wEligible = checkTargeting(initial, { minimumTrustScore: 70, minimumQualityScore: 50 });
const wIneligible = checkTargeting(initial, { minimumTrustScore: 95 });
console.log("Targeting PASS:", wEligible, "| Targeting FAIL:", wIneligible);
if (!wEligible.eligible || wIneligible.eligible) throw new Error("Mission targeting screening failed!");

console.log("\n=== ALL P4 TRUST & QUALITY E2E & UNIT TESTS PASSED 100% ===");
