import type { RecommendationRequest } from "../contracts/recommendation-request.js";
import type { RecommendationStrategy } from "../contracts/recommendation-strategy.js";
import type { Recommendation } from "../contracts/recommendation.js";

export class DefaultRecommendationStrategy implements RecommendationStrategy {
  async recommend(request: RecommendationRequest): Promise<readonly Recommendation[]> {
    return request.feed.items.map((item: { id: string; score: number }) => ({
      id: item.id,
      score: item.score,
      explanation: `Recommended because of score ${item.score}`,
      metadata: { source: item.id },
    }));
  }
}
