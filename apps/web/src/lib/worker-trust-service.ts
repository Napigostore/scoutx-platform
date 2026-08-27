import { prisma } from "@/lib/prisma";

export type TrustLevel = "ELITE" | "TRUSTED" | "STANDARD" | "NEW" | "RESTRICTED";

export function getTrustLevel(trustScore: number): TrustLevel {
  if (trustScore >= 90) return "ELITE";
  if (trustScore >= 75) return "TRUSTED";
  if (trustScore >= 50) return "STANDARD";
  if (trustScore >= 25) return "NEW";
  return "RESTRICTED";
}

export async function recalculateWorkerTrust(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, createdAt: true },
  });

  if (!user) return null;

  const now = new Date();
  const accountAgeDays = Math.max(
    0,
    Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
  );

  // Aggregate stats from DB
  const surveyCompleted = await prisma.surveySubmission.count({
    where: {
      participant: { userId },
      status: "COMPLETED",
      qualityStatus: { in: ["PASSED", "PENDING"] },
    },
  });

  const surveyRejected = await prisma.surveySubmission.count({
    where: { participant: { userId }, qualityStatus: "FAILED" },
  });

  const suspiciousCount = await prisma.surveySubmission.count({
    where: { participant: { userId }, qualityStatus: "SUSPICIOUS" },
  });

  const approvedMissions = await prisma.surveyParticipant.count({
    where: { userId, status: { in: ["SELECTED", "REWARDED"] } },
  });

  const rejectedMissions = surveyRejected;
  const completedMissions = surveyCompleted + approvedMissions;

  const evidenceApproved = await prisma.evidence.count({
    where: { userId },
  });

  const evidenceRejected = 0; // system tracks valid evidence

  const disputedMissions = await prisma.dispute.count({
    where: { initiatorId: userId },
  });

  const wonMissions = await prisma.dispute.count({
    where: { initiatorId: userId, status: "RESOLVED_WORKER_WIN" },
  });

  // Calculate Quality Score (0..100)
  const rawQuality =
    50 + surveyCompleted * 5 + evidenceApproved * 3 - surveyRejected * 10 - suspiciousCount * 15;
  const qualityScore = Math.max(0, Math.min(100, rawQuality));

  // Calculate Trust Score (0..100)
  const totalAttempted = completedMissions + rejectedMissions;
  const completionRate = totalAttempted > 0 ? completedMissions / totalAttempted : 1;
  const rawTrust =
    50 +
    completionRate * 30 +
    accountAgeDays * 0.1 +
    wonMissions * 5 -
    suspiciousCount * 10 -
    (disputedMissions > wonMissions ? 5 : 0);
  const trustScore = Math.max(0, Math.min(100, rawTrust));

  // Calculate Fraud Risk Score (0..100)
  const rawRisk = suspiciousCount * 25 + surveyRejected * 15 + rejectedMissions * 10;
  const fraudRiskScore = Math.max(0, Math.min(100, rawRisk));

  const profileVerified = trustScore >= 80;

  const trustProfile = await prisma.workerTrustProfile.upsert({
    where: { userId },
    create: {
      userId,
      trustScore,
      qualityScore,
      fraudRiskScore,
      completedMissions,
      approvedMissions,
      rejectedMissions,
      disputedMissions,
      wonMissions,
      surveyCompleted,
      surveyRejected,
      suspiciousCount,
      evidenceApproved,
      evidenceRejected,
      accountAgeDays,
      profileVerified,
      lastCalculatedAt: now,
    },
    update: {
      trustScore,
      qualityScore,
      fraudRiskScore,
      completedMissions,
      approvedMissions,
      rejectedMissions,
      disputedMissions,
      wonMissions,
      surveyCompleted,
      surveyRejected,
      suspiciousCount,
      evidenceApproved,
      evidenceRejected,
      accountAgeDays,
      profileVerified,
      lastCalculatedAt: now,
    },
  });

  return {
    ...trustProfile,
    trustLevel: getTrustLevel(trustScore),
  };
}

export async function getWorkerTrustProfile(userId: string) {
  let profile = await prisma.workerTrustProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await recalculateWorkerTrust(userId);
  }

  if (!profile) return null;

  return {
    ...profile,
    trustLevel: getTrustLevel(profile.trustScore),
  };
}
