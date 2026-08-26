import { describe, expect, it } from "vitest";

import type { DiscoveryResult } from "@scoutx/discovery-engine";

import { DefaultFeedBuilder, FeedError, type FeedRequest } from "../src/index.js";

describe("discovery feed core", () => {
  it("builds a feed from discovery results", async () => {
    const builder = new DefaultFeedBuilder();
    const request: FeedRequest = { requesterId: "requester-1" };
    const result: DiscoveryResult = {
      request: { requesterId: "requester-1", context: {} },
      results: [
        {
          candidate: { profileId: "profile-1" },
          score: 0.9,
          breakdown: { relevance: 0.9, compatibility: 0.9, freshness: 0.9 },
        },
      ],
      events: [],
    };

    const page = await builder.build(request, result);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.score).toBe(0.9);
    expect(page.total).toBe(1);
  });

  it("paginates correctly", async () => {
    const builder = new DefaultFeedBuilder();
    const request: FeedRequest = { requesterId: "requester-1", pageSize: 1 };
    const result: DiscoveryResult = {
      request: { requesterId: "requester-1", context: {} },
      results: [
        {
          candidate: { profileId: "profile-1" },
          score: 0.9,
          breakdown: { relevance: 0.9, compatibility: 0.9, freshness: 0.9 },
        },
        {
          candidate: { profileId: "profile-2" },
          score: 0.8,
          breakdown: { relevance: 0.8, compatibility: 0.8, freshness: 0.8 },
        },
      ],
      events: [],
    };

    const firstPage = await builder.build(request, result);
    const secondPage = await builder.build(
      { ...request, cursor: firstPage.nextCursor?.value },
      result,
    );

    expect(firstPage.items[0]?.id).toBe("profile-1");
    expect(secondPage.items[0]?.id).toBe("profile-2");
    expect(firstPage.hasNextPage).toBe(true);
    expect(secondPage.hasNextPage).toBe(false);
  });

  it("supports filters", async () => {
    const builder = new DefaultFeedBuilder();
    const request: FeedRequest = {
      requesterId: "requester-1",
      filters: [{ key: "country", value: "US" }],
    };
    const result: DiscoveryResult = {
      request: { requesterId: "requester-1", context: {} },
      results: [
        {
          candidate: { profileId: "profile-1" },
          score: 0.9,
          breakdown: { relevance: 0.9, compatibility: 0.9, freshness: 0.9 },
        },
      ],
      events: [],
    };

    const page = await builder.build(request, {
      ...result,
      results: [
        {
          candidate: { profileId: "profile-1" },
          score: 0.1,
          breakdown: { relevance: 0.1, compatibility: 0.1, freshness: 0.1 },
        },
      ],
    });

    expect(page.total).toBe(0);
  });

  it("handles empty results", async () => {
    const builder = new DefaultFeedBuilder();
    const page = await builder.build(
      { requesterId: "requester-1" },
      {
        request: { requesterId: "requester-1", context: {} },
        results: [],
        events: [],
      },
    );

    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.nextCursor).toBeNull();
  });

  it("does not mutate the discovery result", async () => {
    const builder = new DefaultFeedBuilder();
    const result: DiscoveryResult = {
      request: { requesterId: "requester-1", context: {} },
      results: [
        {
          candidate: { profileId: "profile-1" },
          score: 0.7,
          breakdown: { relevance: 0.7, compatibility: 0.7, freshness: 0.7 },
        },
      ],
      events: [],
    };

    await builder.build({ requesterId: "requester-1" }, result);

    expect(result.results).toHaveLength(1);
  });

  it("keeps stable ordering", async () => {
    const builder = new DefaultFeedBuilder();
    const request: FeedRequest = { requesterId: "requester-1", pageSize: 2 };
    const result: DiscoveryResult = {
      request: { requesterId: "requester-1", context: {} },
      results: [
        {
          candidate: { profileId: "profile-1" },
          score: 0.8,
          breakdown: { relevance: 0.8, compatibility: 0.8, freshness: 0.8 },
        },
        {
          candidate: { profileId: "profile-2" },
          score: 0.8,
          breakdown: { relevance: 0.8, compatibility: 0.8, freshness: 0.8 },
        },
      ],
      events: [],
    };

    const page = await builder.build(request, result);

    expect(page.items.map((item) => item.id)).toEqual(["profile-1", "profile-2"]);
  });

  it("rejects invalid page size", async () => {
    const builder = new DefaultFeedBuilder();
    await expect(
      builder.build(
        { requesterId: "requester-1", pageSize: 0 },
        { request: { requesterId: "requester-1", context: {} }, results: [], events: [] },
      ),
    ).rejects.toBeInstanceOf(FeedError);
  });
});
