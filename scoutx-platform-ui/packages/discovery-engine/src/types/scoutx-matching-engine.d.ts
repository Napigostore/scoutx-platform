declare module "@scoutx/matching-engine" {
  export interface MatchCandidate {
    readonly profileId: string;
  }

  export interface MatchContext {
    readonly requesterId: string;
    readonly candidates: readonly MatchCandidate[];
  }

  export interface ScoreBreakdown {
    readonly relevance: number;
    readonly compatibility: number;
    readonly freshness: number;
  }

  export interface MatchResult {
    readonly candidate: MatchCandidate;
    readonly score: number;
    readonly breakdown: ScoreBreakdown;
  }

  export interface MatchingEngine {
    match(context: MatchContext): Promise<readonly MatchResult[]>;
  }
}
