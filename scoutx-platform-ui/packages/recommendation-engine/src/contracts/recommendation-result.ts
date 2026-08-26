import type { Recommendation } from "./recommendation.js";
import type { RecommendationRequest } from "./recommendation-request.js";

export interface RecommendationResult {
  readonly request: RecommendationRequest;
  readonly recommendations: readonly Recommendation[];
}
