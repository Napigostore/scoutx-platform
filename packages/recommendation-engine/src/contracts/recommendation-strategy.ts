import type { RecommendationRequest } from "./recommendation-request.js";
import type { Recommendation } from "./recommendation.js";

export interface RecommendationStrategy {
  recommend(request: RecommendationRequest): Promise<readonly Recommendation[]>;
}
