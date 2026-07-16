import type { DiscoveryRequest } from "./discovery-request.js";

export interface RecommendationProvider {
  getRecommendations(request: DiscoveryRequest): Promise<readonly unknown[]>;
}
