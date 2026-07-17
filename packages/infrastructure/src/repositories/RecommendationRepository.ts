import type { Recommendation } from "@scoutx/recommendation-engine";

export interface RecommendationRepository {
  save(recommendation: Recommendation): Promise<void>;
  findById(id: string): Promise<Recommendation | null>;
  delete(id: string): Promise<void>;
  findByScoreThreshold(minScore: number): Promise<readonly Recommendation[]>;
}
