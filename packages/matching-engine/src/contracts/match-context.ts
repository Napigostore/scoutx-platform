import type { MatchCandidate } from "./match-candidate.js";

export interface MatchContext {
  readonly requesterId: string;
  readonly candidates: readonly MatchCandidate[];
}
