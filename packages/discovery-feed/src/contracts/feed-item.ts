import type { MatchResult } from "@scoutx/discovery-engine";

export interface FeedItem {
  readonly id: string;
  readonly score: number;
  readonly payload: Record<string, unknown>;
  readonly source: MatchResult;
}
