import type { DiscoveryProfileId } from "@scoutx/domain";

export interface FeedRequest {
  readonly requesterId: DiscoveryProfileId;
  readonly pageSize?: number;
  readonly cursor?: string;
  readonly filters?: readonly FeedFilter[];
}

export interface FeedFilter {
  readonly key: string;
  readonly value: string;
}
