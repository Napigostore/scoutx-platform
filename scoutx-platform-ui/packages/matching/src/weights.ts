import type { MatchingWeights } from "@scoutx/types";

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  distance: 0.3,
  reliability: 0.2,
  categoryFit: 0.2,
  tagOverlap: 0.15,
  availability: 0.1,
  urgencyAlignment: 0.05,
};

export function normalizeWeights(weights: MatchingWeights): MatchingWeights {
  const total =
    weights.distance +
    weights.reliability +
    weights.categoryFit +
    weights.tagOverlap +
    weights.availability +
    weights.urgencyAlignment;

  if (total <= 0) {
    throw new Error("Matching weights must sum to a positive value");
  }

  return {
    distance: weights.distance / total,
    reliability: weights.reliability / total,
    categoryFit: weights.categoryFit / total,
    tagOverlap: weights.tagOverlap / total,
    availability: weights.availability / total,
    urgencyAlignment: weights.urgencyAlignment / total,
  };
}
