import type { DiscoveryProfileId } from "@scoutx/domain";
import type { FeedPage } from "@scoutx/discovery-feed";

export interface RecommendationRequest {
  readonly requesterId: DiscoveryProfileId;
  readonly feed: FeedPage;
  readonly context?: Record<string, unknown>;
}
