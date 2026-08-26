import type { Recommendation } from "./recommendation.js";

export interface RankingPolicy {
  rank(recommendations: readonly Recommendation[]): readonly Recommendation[];
}
