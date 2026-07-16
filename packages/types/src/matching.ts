import { z } from "zod";

export const MatchScoreBreakdownSchema = z.object({
  distance: z.number().min(0).max(1),
  reliability: z.number().min(0).max(1),
  categoryFit: z.number().min(0).max(1),
  tagOverlap: z.number().min(0).max(1),
  availability: z.number().min(0).max(1),
  urgencyAlignment: z.number().min(0).max(1),
});
export type MatchScoreBreakdown = z.infer<typeof MatchScoreBreakdownSchema>;

export const MatchResultSchema = z.object({
  scoutId: z.string().uuid(),
  missionId: z.string().uuid(),
  score: z.number().min(0).max(1),
  distanceMeters: z.number().nonnegative(),
  breakdown: MatchScoreBreakdownSchema,
  reasons: z.array(z.string().min(1)).min(1),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

export const MatchingWeightsSchema = z.object({
  distance: z.number().positive(),
  reliability: z.number().positive(),
  categoryFit: z.number().positive(),
  tagOverlap: z.number().positive(),
  availability: z.number().positive(),
  urgencyAlignment: z.number().positive(),
});
export type MatchingWeights = z.infer<typeof MatchingWeightsSchema>;
