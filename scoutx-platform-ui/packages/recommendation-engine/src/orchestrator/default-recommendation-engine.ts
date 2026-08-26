import { RecommendationError } from "../errors/recommendation-error.js";
import type { RankingPolicy } from "../contracts/ranking-policy.js";
import type { RecommendationEngine } from "../contracts/recommendation-engine.js";
import type { RecommendationRequest } from "../contracts/recommendation-request.js";
import type { RecommendationResult } from "../contracts/recommendation-result.js";
import type { RecommendationStrategy } from "../contracts/recommendation-strategy.js";

export class DefaultRecommendationEngine implements RecommendationEngine {
  constructor(
    private readonly strategy: RecommendationStrategy,
    private readonly rankingPolicy: RankingPolicy,
  ) {}

  async recommend(request: RecommendationRequest): Promise<RecommendationResult> {
    if (!request.requesterId) {
      throw new RecommendationError("requesterId is required");
    }

    if (!request.feed) {
      throw new RecommendationError("feed is required");
    }

    try {
      const recommendations = await this.strategy.recommend(request);
      const ranked = this.rankingPolicy.rank(recommendations);

      return {
        request: {
          requesterId: request.requesterId,
          feed: request.feed,
          context: request.context ? { ...request.context } : undefined,
        },
        recommendations: ranked.map((item) => ({
          ...item,
          explanation: `${item.explanation} [ranked]`,
        })),
      };
    } catch (error) {
      if (error instanceof RecommendationError) {
        throw error;
      }

      throw new RecommendationError("failed to generate recommendations");
    }
  }
}
