import type { DiscoveryResult } from "./discovery-result.js";

export interface FeedBuilder {
  build(result: DiscoveryResult): Promise<DiscoveryResult>;
}
