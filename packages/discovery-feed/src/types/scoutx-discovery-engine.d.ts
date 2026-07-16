declare module "@scoutx/discovery-engine" {
  export interface DiscoveryRequest {
    readonly requesterId: string;
    readonly context: Record<string, unknown>;
    readonly candidates?: readonly string[];
  }

  export interface DiscoveryEvent {
    readonly type: string;
    readonly payload?: Record<string, unknown>;
  }

  export interface MatchCandidate {
    readonly profileId: string;
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

  export interface DiscoveryResult {
    readonly request: DiscoveryRequest;
    readonly results: readonly MatchResult[];
    readonly events: readonly DiscoveryEvent[];
  }
}
