import type { DiscoveryResult } from "@scoutx/discovery-engine";

import type { FeedBuilder } from "../contracts/feed-builder.js";
import type { FeedItem } from "../contracts/feed-item.js";
import type { FeedPage } from "../contracts/feed-page.js";
import type { FeedFilter, FeedRequest } from "../contracts/feed-request.js";
import { FeedError } from "../errors/feed-error.js";

function matchesFilters(item: FeedItem, filters?: readonly FeedFilter[]): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }

  return filters.every((filter) => String(item.payload[filter.key]) === filter.value);
}

export class DefaultFeedBuilder implements FeedBuilder {
  async build(request: FeedRequest, result: DiscoveryResult): Promise<FeedPage> {
    if (request.pageSize !== undefined && request.pageSize < 1) {
      throw new FeedError("pageSize must be positive");
    }

    const items = result.results
      .map((entry, index) => ({
        id: entry.candidate.profileId,
        score: entry.score,
        payload: { profileId: entry.candidate.profileId, index },
        source: entry,
      }))
      .filter((item) => matchesFilters(item, request.filters));

    const sorted = [...items].sort((left, right) => {
      if (right.score === left.score) {
        return left.payload.index - (right.payload.index as number);
      }

      return right.score - left.score;
    });

    const pageSize = request.pageSize ?? sorted.length;
    if (pageSize > 100) {
      throw new FeedError("pageSize cannot exceed 100");
    }
    const cursor = request.cursor ? Number.parseInt(request.cursor, 10) : 0;
    const start = Number.isNaN(cursor) ? 0 : cursor;
    const sliced = sorted.slice(start, start + pageSize);
    const nextCursor =
      start + pageSize < sorted.length ? { value: String(start + pageSize) } : null;

    return {
      items: sliced,
      nextCursor,
      hasNextPage: nextCursor !== null,
      total: sorted.length,
    };
  }
}
