import { describe, expect, it } from "vitest";

import type { FeedPage } from "@scoutx/discovery-feed";

import {
  DefaultRecommendationEngine,
  DefaultRankingPolicy,
  DefaultRecommendationStrategy,
  RecommendationError,
  type RecommendationRequest,
  type RecommendationStrategy,
  type RankingPolicy,
} from "../src/index.js";

describe("recommendation engine core", () => {
  it("calls the strategy and returns ranked recommendations", async () => {
    const strategy: RecommendationStrategy = {
      async recommend(request) {
        return request.feed.items.map((item: { id: string; score: number }) => ({
          id: item.id,
          score: item.score,
          explanation: `strategy:${item.id}`,
        }));
      },
    };

    const engine = new DefaultRecommendationEngine(strategy, new DefaultRankingPolicy());
    const request: RecommendationRequest = {
      requesterId: "requester-1",
      feed: {
        items: [
          { id: "a", score: 0.2, payload: {}, source: undefined as never },
          { id: "b", score: 0.8, payload: {}, source: undefined as never },
        ],
        nextCursor: null,
        hasNextPage: false,
        total: 2,
      } as FeedPage,
    };

    const result = await engine.recommend(request);

    expect(result.recommendations[0]?.id).toBe("b");
    expect(result.recommendations[0]?.explanation).toContain("ranked");
  });

  it("creates explanations", async () => {
    const engine = new DefaultRecommendationEngine(
      new DefaultRecommendationStrategy(),
      new DefaultRankingPolicy(),
    );
    const request: RecommendationRequest = {
      requesterId: "requester-1",
      feed: {
        items: [{ id: "profile-1", score: 0.4, payload: {}, source: undefined as never }],
        nextCursor: null,
        hasNextPage: false,
        total: 1,
      } as FeedPage,
    };

    const result = await engine.recommend(request);

    expect(result.recommendations[0]?.explanation).toContain("Recommended because of score");
  });

  it("keeps stable ordering", async () => {
    const rankingPolicy: RankingPolicy = {
      rank(recommendations) {
        return [...recommendations];
      },
    };

    const engine = new DefaultRecommendationEngine(
      {
        async recommend(request) {
          return request.feed.items.map((item: { id: string }) => ({
            id: item.id,
            score: 0.5,
            explanation: item.id,
          }));
        },
      },
      rankingPolicy,
    );

    const request: RecommendationRequest = {
      requesterId: "requester-1",
      feed: {
        items: [{ id: "first", score: 0.5, payload: {}, source: undefined as never }],
        nextCursor: null,
        hasNextPage: false,
        total: 1,
      } as FeedPage,
    };

    const result = await engine.recommend(request);
    expect(result.recommendations.map((item) => item.id)).toEqual(["first"]);
  });

  it("handles empty feed", async () => {
    const engine = new DefaultRecommendationEngine(
      new DefaultRecommendationStrategy(),
      new DefaultRankingPolicy(),
    );
    const request: RecommendationRequest = {
      requesterId: "requester-1",
      feed: {
        items: [],
        nextCursor: null,
        hasNextPage: false,
        total: 0,
      } as FeedPage,
    };

    const result = await engine.recommend(request);
    expect(result.recommendations).toEqual([]);
  });

  it("does not mutate the incoming request", async () => {
    const request: RecommendationRequest = {
      requesterId: "requester-1",
      feed: {
        items: [{ id: "profile-1", score: 0.5, payload: {}, source: undefined as never }],
        nextCursor: null,
        hasNextPage: false,
        total: 1,
      } as FeedPage,
      context: { country: "US" },
    };

    const engine = new DefaultRecommendationEngine(
      new DefaultRecommendationStrategy(),
      new DefaultRankingPolicy(),
    );
    await engine.recommend(request);

    expect(request.context).toEqual({ country: "US" });
  });

  it("supports dependency injection for strategy and ranking", async () => {
    const strategy: RecommendationStrategy = {
      async recommend() {
        return [{ id: "x", score: 0.3, explanation: "custom" }];
      },
    };
    const rankingPolicy: RankingPolicy = {
      rank(recommendations) {
        return recommendations;
      },
    };

    const engine = new DefaultRecommendationEngine(strategy, rankingPolicy);
    const result = await engine.recommend({
      requesterId: "requester-1",
      feed: {
        items: [],
        nextCursor: null,
        hasNextPage: false,
        total: 0,
      } as FeedPage,
    });

    expect(result.recommendations[0]?.id).toBe("x");
  });

  it("propagates errors", async () => {
    const engine = new DefaultRecommendationEngine(
      {
        async recommend() {
          throw new Error("strategy failed");
        },
      },
      new DefaultRankingPolicy(),
    );

    await expect(
      engine.recommend({
        requesterId: "requester-1",
        feed: { items: [], nextCursor: null, hasNextPage: false, total: 0 } as FeedPage,
      }),
    ).rejects.toBeInstanceOf(RecommendationError);
  });
});
