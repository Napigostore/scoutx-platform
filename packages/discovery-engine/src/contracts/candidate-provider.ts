import type { MatchCandidate } from "@scoutx/matching-engine";

import type { DiscoveryRequest } from "./discovery-request.js";

export interface CandidateProvider {
  loadCandidates(request: DiscoveryRequest): Promise<readonly MatchCandidate[]>;
}
