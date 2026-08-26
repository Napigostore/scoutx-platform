import type { DiscoveryRequest, DiscoveryResult } from "../contracts/index.js";

export interface DiscoveryEngine {
  execute(request: DiscoveryRequest): Promise<DiscoveryResult>;
}
