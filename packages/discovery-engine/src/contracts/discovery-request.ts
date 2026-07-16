import type { DiscoveryProfileId } from "@scoutx/domain";

export interface DiscoveryRequest {
  readonly requesterId: DiscoveryProfileId;
  readonly context: Record<string, unknown>;
  readonly candidates?: readonly DiscoveryProfileId[];
}
