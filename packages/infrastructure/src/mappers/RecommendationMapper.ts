import type { Recommendation } from "@scoutx/recommendation-engine";

export interface PrismaRecommendation {
  id: string;
  score: number;
  explanation: string;
  metadata: string | null; // JSON string
}

export class RecommendationMapper {
  static toDomain(prismaRec: PrismaRecommendation): Recommendation {
    return {
      id: prismaRec.id,
      score: prismaRec.score,
      explanation: prismaRec.explanation,
      metadata: prismaRec.metadata ? JSON.parse(prismaRec.metadata) : undefined,
    };
  }

  static toPrisma(domainRec: Recommendation): PrismaRecommendation {
    return {
      id: domainRec.id,
      score: domainRec.score,
      explanation: domainRec.explanation,
      metadata: domainRec.metadata ? JSON.stringify(domainRec.metadata) : null,
    };
  }
}
