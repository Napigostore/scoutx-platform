import type { ScoreBreakdown } from "../contracts/match-result.js";

export function clampScore(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function scoreFromBreakdown(breakdown: ScoreBreakdown): number {
  const total = breakdown.relevance + breakdown.compatibility + breakdown.freshness;
  return clampScore(total / 3);
}
