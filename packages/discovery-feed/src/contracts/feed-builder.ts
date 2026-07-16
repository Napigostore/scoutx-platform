import type { DiscoveryResult } from "@scoutx/discovery-engine";

import type { FeedPage } from "./feed-page.js";
import type { FeedRequest } from "./feed-request.js";

export interface FeedBuilder {
  build(request: FeedRequest, result: DiscoveryResult): Promise<FeedPage>;
}
