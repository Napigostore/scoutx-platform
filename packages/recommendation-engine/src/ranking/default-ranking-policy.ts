import type { RankingPolicy } from "../contracts/ranking-policy.js";
import type { Recommendation } from "../contracts/recommendation.js";

export class DefaultRankingPolicy implements RankingPolicy {
  rank(recommendations: readonly Recommendation[]): readonly Recommendation[] {
    return [...recommendations].sort((left, right) => {
      if (right.score === left.score) {
        return left.id.localeCompare(right.id);
      }

      return right.score - left.score;
    });
  }
}
