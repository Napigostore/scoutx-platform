import type { RecommendationRequest } from "./recommendation-request.js";
import type { RecommendationResult } from "./recommendation-result.js";

export interface RecommendationEngine {
  recommend(request: RecommendationRequest): Promise<RecommendationResult>;
}
