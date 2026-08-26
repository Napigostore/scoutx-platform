import type { Recommendation } from "@scoutx/recommendation-engine";
import type { RecommendationRepository } from "./RecommendationRepository";
import { RecommendationMapper, type PrismaRecommendation } from "../mappers/RecommendationMapper";

export class PrismaRecommendationRepository implements RecommendationRepository {
  private recommendations = new Map<string, PrismaRecommendation>();

  async save(recommendation: Recommendation): Promise<void> {
    const prismaData = RecommendationMapper.toPrisma(recommendation);
    this.recommendations.set(recommendation.id, prismaData);
  }

  async findById(id: string): Promise<Recommendation | null> {
    const data = this.recommendations.get(id);
    if (!data) return null;
    return RecommendationMapper.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.recommendations.delete(id);
  }

  async findByScoreThreshold(minScore: number): Promise<readonly Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter((data) => data.score >= minScore)
      .map((data) => RecommendationMapper.toDomain(data));
  }
}
