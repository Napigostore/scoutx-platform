import { MatchingError } from "../errors/matching-error.js";
import { scoreFromBreakdown } from "../scoring/score.js";
import { createScoreBreakdown } from "../scoring/score-breakdown.js";
import type { MatchCandidate } from "../contracts/match-candidate.js";
import type { MatchContext } from "../contracts/match-context.js";
import type { MatchResult, ScoreBreakdown } from "../contracts/match-result.js";
import type { MatchingEngine } from "../contracts/matching-engine.js";
import type { ScoringRule } from "../contracts/scoring-rule.js";

export class WeightedScorer {
  constructor(private readonly rules: readonly ScoringRule[] = []) {}

  score(candidate: MatchCandidate, context: MatchContext): MatchResult {
    if (this.rules.some((rule) => rule.weight < 0 || rule.weight > 1)) {
      throw new MatchingError("Scoring rule weights must be between 0 and 1");
    }

    if (this.rules.length === 0) {
      return {
        candidate,
        score: 0.5,
        breakdown: createScoreBreakdown(),
      };
    }

    const initialBreakdown = createScoreBreakdown();
    const breakdown = this.rules.reduce<{
      relevance: number;
      compatibility: number;
      freshness: number;
    }>((acc, rule) => {
      const value = rule.score(candidate, context);
      const weighted = value * rule.weight;

      if (rule.name === "relevance") {
        acc.relevance = weighted;
      } else if (rule.name === "compatibility") {
        acc.compatibility = weighted;
      } else if (rule.name === "freshness") {
        acc.freshness = weighted;
      }

      return acc;
    }, initialBreakdown);

    const normalizedBreakdown: ScoreBreakdown = {
      relevance: breakdown.relevance,
      compatibility: breakdown.compatibility,
      freshness: breakdown.freshness,
    };

    const score = scoreFromBreakdown(normalizedBreakdown);

    return {
      candidate,
      score,
      breakdown: normalizedBreakdown,
    };
  }
}

export class DefaultMatchingEngine implements MatchingEngine {
  constructor(private readonly scorer: WeightedScorer = new WeightedScorer()) {}

  async match(context: MatchContext): Promise<readonly MatchResult[]> {
    const filtered = context.candidates.filter(
      (candidate) => candidate.profileId !== context.requesterId,
    );

    const results = filtered.map((candidate) => this.scorer.score(candidate, context));

    const sorted = [...results].sort((left, right) => {
      if (right.score === left.score) {
        const leftIndex = filtered.findIndex(
          (candidate) => candidate.profileId === left.candidate.profileId,
        );
        const rightIndex = filtered.findIndex(
          (candidate) => candidate.profileId === right.candidate.profileId,
        );
        return leftIndex - rightIndex;
      }

      return right.score - left.score;
    });

    return sorted;
  }
}
