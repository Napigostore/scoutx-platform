import type { MatchContext } from "./match-context.js";
import type { MatchResult } from "./match-result.js";

export interface MatchingEngine {
  match(context: MatchContext): Promise<readonly MatchResult[]>;
}
