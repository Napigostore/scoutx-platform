import { describe, expect, it } from "vitest";

import type { MatchCandidate, MatchResult, MatchingEngine } from "@scoutx/matching-engine";

import {
  DefaultDiscoveryEngine,
  DiscoveryError,
  type CandidateProvider,
  type DiscoveryRequest,
  type PostProcessor,
  type RecommendationProvider,
} from "../src/index.js";

describe("discovery engine core", () => {
  it("executes the workflow in the correct order", async () => {
    const events: string[] = [];

    const candidateProvider: CandidateProvider = {
      async loadCandidates(request) {
        events.push(`load:${request.requesterId}`);
        return [{ profileId: "profile-1" } as MatchCandidate];
      },
    };

    const matchingEngine: MatchingEngine = {
      async match(context) {
        events.push(`match:${context.requesterId}`);
        return [
          {
            candidate: { profileId: "profile-1" },
            score: 0.8,
            breakdown: { relevance: 0.8, compatibility: 0.8, freshness: 0.8 },
          } as MatchResult,
        ];
      },
    };

    const postProcessor: PostProcessor = {
      async process(request, results) {
        events.push(`post:${request.requesterId}:${results.length}`);
        return results;
      },
    };

    const engine = new DefaultDiscoveryEngine(candidateProvider, matchingEngine, postProcessor);

    await engine.execute({ requesterId: "requester-1", context: { country: "US" } });

    expect(events).toEqual(["load:requester-1", "match:requester-1", "post:requester-1:1"]);
  });

  it("calls the matching engine exactly once", async () => {
    let calls = 0;

    const candidateProvider: CandidateProvider = {
      async loadCandidates() {
        return [{ profileId: "profile-1" } as MatchCandidate];
      },
    };

    const matchingEngine: MatchingEngine = {
      async match() {
        calls += 1;
        return [];
      },
    };

    const engine = new DefaultDiscoveryEngine(candidateProvider, matchingEngine);
    await engine.execute({ requesterId: "requester-1", context: {} });

    expect(calls).toBe(1);
  });

  it("propagates errors as discovery errors", async () => {
    const candidateProvider: CandidateProvider = {
      async loadCandidates() {
        throw new Error("provider failed");
      },
    };

    const engine = new DefaultDiscoveryEngine(candidateProvider, {
      async match() {
        return [];
      },
    });

    await expect(
      engine.execute({ requesterId: "requester-1", context: {} }),
    ).rejects.toBeInstanceOf(DiscoveryError);
  });

  it("does not mutate the incoming request", async () => {
    const request: DiscoveryRequest = {
      requesterId: "requester-1",
      context: { country: "US" },
      candidates: ["candidate-1"],
    };

    const engine = new DefaultDiscoveryEngine(
      {
        async loadCandidates() {
          return [];
        },
      },
      {
        async match() {
          return [];
        },
      },
    );

    await engine.execute(request);

    expect(request).toEqual({
      requesterId: "requester-1",
      context: { country: "US" },
      candidates: ["candidate-1"],
    });
  });

  it("handles empty candidates", async () => {
    const engine = new DefaultDiscoveryEngine(
      {
        async loadCandidates() {
          return [];
        },
      },
      {
        async match() {
          return [];
        },
      },
    );

    const result = await engine.execute({ requesterId: "requester-1", context: {} });

    expect(result.results).toEqual([]);
  });

  it("supports dependency injection for optional providers", async () => {
    const recommendationProvider: RecommendationProvider = {
      async getRecommendations() {
        return [{ id: "rec-1" }];
      },
    };

    const engine = new DefaultDiscoveryEngine(
      {
        async loadCandidates() {
          return [];
        },
      },
      {
        async match() {
          return [];
        },
      },
      undefined,
      recommendationProvider,
    );

    const result = await engine.execute({ requesterId: "requester-1", context: {} });

    expect(result.events.some((event) => event.type === "recommendations_loaded")).toBe(true);
  });
});
