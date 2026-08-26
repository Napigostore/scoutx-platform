import type { MatchResult } from "@scoutx/matching-engine";

import type { DiscoveryRequest } from "./discovery-request.js";

export interface PostProcessor {
  process(
    request: DiscoveryRequest,
    results: readonly MatchResult[],
  ): Promise<readonly MatchResult[]>;
}
