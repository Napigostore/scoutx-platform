import type { MatchCandidate } from "./match-candidate.js";
import type { MatchContext } from "./match-context.js";

export interface ScoringRule {
  readonly name: string;
  readonly weight: number;
  score(candidate: MatchCandidate, context: MatchContext): number;
}
