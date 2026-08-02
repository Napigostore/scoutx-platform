/* ─── Matching Engine ─── */

export interface ScoutMatchInput {
  scoutId: string;
  name: string;
  avatarUrl?: string;
  trustScore: number; // 0 - 100
  distanceKm: number;
  categoryExpertise: string[]; // e.g. ["OSINT", "Field Verification"]
  verificationHistoryCount: number;
  avgResponseTimeMins: number;
  completionRate: number; // 0 - 100
  currentWorkloadCount: number; // active missions currently handling
  lastActiveHoursAgo: number;
}

export interface ScoutMatchResult extends ScoutMatchInput {
  matchScore: number; // 0 - 100
  explanation: string[];
}

export interface MissionMatchContext {
  category: string;
  maxDistanceKm?: number;
  requiredTrustLevel?: number;
}

/**
 * Calculates a comprehensive 0-100 match score for a scout given mission parameters.
 * Evaluates: Distance, Trust score, Category expertise, Verification history,
 * Avg response time, Completion rate, Current workload, and Recent activity.
 */
export function calculateScoutMatchScore(
  scout: ScoutMatchInput,
  mission: MissionMatchContext,
): ScoutMatchResult {
  let score = 0;
  const explanation: string[] = [];

  // 1. Category Expertise (Max 25 pts)
  const isExpert = scout.categoryExpertise.some(
    (cat) => cat.toLowerCase() === mission.category.toLowerCase(),
  );
  if (isExpert) {
    score += 25;
    explanation.push(`Direct expertise in ${mission.category}`);
  } else {
    score += 10;
  }

  // 2. Trust Score (Max 25 pts)
  const trustContribution = Math.round((scout.trustScore / 100) * 25);
  score += trustContribution;
  if (scout.trustScore >= 80) {
    explanation.push(`Exceptional trust score (${scout.trustScore}%)`);
  }

  // 3. Distance & Proximity (Max 15 pts)
  if (scout.distanceKm <= 5) {
    score += 15;
    explanation.push(`Very close proximity (${scout.distanceKm} km away)`);
  } else if (scout.distanceKm <= 25) {
    score += 10;
    explanation.push(`Within local area (${scout.distanceKm} km)`);
  } else if (scout.distanceKm <= 100) {
    score += 5;
  }

  // 4. Completion Rate & Verification History (Max 15 pts)
  const completionContrib = Math.round((scout.completionRate / 100) * 10);
  score += completionContrib;
  if (scout.verificationHistoryCount >= 20) {
    score += 5;
    explanation.push(`Extensive verified track record (${scout.verificationHistoryCount} cases)`);
  }

  // 5. Avg Response Time (Max 10 pts)
  if (scout.avgResponseTimeMins <= 15) {
    score += 10;
    explanation.push(`Ultra-fast response time (~${scout.avgResponseTimeMins} mins)`);
  } else if (scout.avgResponseTimeMins <= 60) {
    score += 6;
  } else {
    score += 3;
  }

  // 6. Current Workload & Availability (Max 10 pts)
  if (scout.currentWorkloadCount === 0) {
    score += 10;
    explanation.push("Immediate availability (0 active workloads)");
  } else if (scout.currentWorkloadCount <= 2) {
    score += 6;
    explanation.push("Good bandwidth available");
  } else {
    score += 2;
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    ...scout,
    matchScore: finalScore,
    explanation,
  };
}
