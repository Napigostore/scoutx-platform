import type { MatchResult } from "@scoutx/matching-engine";

import type { DiscoveryRequest } from "./discovery-request.js";

export interface DiscoveryResult {
  readonly request: DiscoveryRequest;
  readonly results: readonly MatchResult[];
  readonly events: readonly DiscoveryEvent[];
}

export interface DiscoveryEvent {
  readonly type: string;
  readonly payload?: Record<string, unknown>;
}
