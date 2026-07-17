import type { DiscoveryProfileId } from "@scoutx/domain";

export interface Recommendation {
  readonly id: DiscoveryProfileId;
  readonly score: number;
  readonly explanation: string;
  readonly metadata?: Record<string, unknown>;
}
