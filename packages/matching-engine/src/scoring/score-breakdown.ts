import type { ScoreBreakdown } from "../contracts/match-result.js";

export function createScoreBreakdown(overrides?: Partial<ScoreBreakdown>): ScoreBreakdown {
  return {
    relevance: 0.5,
    compatibility: 0.5,
    freshness: 0.5,
    ...overrides,
  };
}
