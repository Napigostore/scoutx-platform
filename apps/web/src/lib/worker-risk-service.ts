import { getWorkerTrustProfile } from "@/lib/worker-trust-service";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";

export async function evaluateWorkerRisk(userId: string): Promise<{
  riskLevel: RiskLevel;
  fraudRiskScore: number;
  signals: string[];
}> {
  const trustProfile = await getWorkerTrustProfile(userId);
  if (!trustProfile) {
    return { riskLevel: "LOW", fraudRiskScore: 0, signals: [] };
  }

  const signals: string[] = [];
  const riskScore = trustProfile.fraudRiskScore;

  if (trustProfile.suspiciousCount > 0) {
    signals.push(
      `SUSPICIOUS_SUBMISSIONS: ${trustProfile.suspiciousCount} suspicious duration/pattern flags`,
    );
  }

  if (trustProfile.surveyRejected > 0) {
    signals.push(`REJECTED_SURVEYS: ${trustProfile.surveyRejected} failed attention checks`);
  }

  let riskLevel: RiskLevel = "LOW";
  if (riskScore >= 75) {
    riskLevel = "BLOCKED";
  } else if (riskScore >= 50) {
    riskLevel = "HIGH";
  } else if (riskScore >= 25) {
    riskLevel = "MEDIUM";
  }

  return {
    riskLevel,
    fraudRiskScore: riskScore,
    signals,
  };
}
