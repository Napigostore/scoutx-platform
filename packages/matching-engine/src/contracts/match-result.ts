import type { MatchCandidate } from "./match-candidate.js";

export interface ScoreBreakdown {
  readonly relevance: number;
  readonly compatibility: number;
  readonly freshness: number;
}

export interface MatchResult {
  readonly candidate: MatchCandidate;
  readonly score: number;
  readonly breakdown: ScoreBreakdown;
}
