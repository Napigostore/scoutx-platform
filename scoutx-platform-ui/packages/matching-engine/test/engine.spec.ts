import { describe, expect, it } from "vitest";

import {
  DefaultMatchingEngine,
  MatchingError,
  WeightedScorer,
  type MatchCandidate,
  type MatchContext,
} from "../src/index.js";

describe("matching engine core", () => {
  it("filters out the requester from candidates", async () => {
    const context: MatchContext = {
      requesterId: "requester-1",
      candidates: [
        { profileId: "profile-1" },
        { profileId: "requester-1" },
        { profileId: "profile-2" },
      ],
    };

    const engine = new DefaultMatchingEngine();
    const results = await engine.match(context);

    expect(results.map((result) => result.candidate.profileId)).toEqual(["profile-1", "profile-2"]);
  });

  it("normalizes scores into the 0..1 range", async () => {
    const context: MatchContext = {
      requesterId: "requester-1",
      candidates: [{ profileId: "profile-1" }],
    };

    const engine = new DefaultMatchingEngine();
    const [result] = await engine.match(context);

    expect(result).toBeDefined();
    expect(result?.score).toBeGreaterThanOrEqual(0);
    expect(result?.score).toBeLessThanOrEqual(1);
  });

  it("rejects scoring rules with invalid weights", () => {
    const scorer = new WeightedScorer([
      {
        name: "invalid",
        weight: 1.2,
        score: () => 0.7,
      },
    ]);

    expect(() =>
      scorer.score({ profileId: "profile-1" }, { requesterId: "requester-1", candidates: [] }),
    ).toThrow(MatchingError);
  });

  it("keeps stable ordering when scores are equal", async () => {
    const context: MatchContext = {
      requesterId: "requester-1",
      candidates: [{ profileId: "profile-2" }, { profileId: "profile-1" }],
    };

    const engine = new DefaultMatchingEngine(
      new WeightedScorer([
        {
          name: "flat",
          weight: 1,
          score: () => 0.5,
        },
      ]),
    );

    const results = await engine.match(context);

    expect(results.map((result) => result.candidate.profileId)).toEqual(["profile-2", "profile-1"]);
  });

  it("returns the expected breakdown", () => {
    const scorer = new WeightedScorer([
      {
        name: "relevance",
        weight: 0.5,
        score: () => 0.8,
      },
      {
        name: "compatibility",
        weight: 0.5,
        score: () => 0.4,
      },
      {
        name: "freshness",
        weight: 0.5,
        score: () => 0.2,
      },
    ]);

    const result = scorer.score(
      { profileId: "profile-1" },
      { requesterId: "requester-1", candidates: [] },
    );

    expect(result.breakdown).toEqual({
      relevance: 0.4,
      compatibility: 0.2,
      freshness: 0.1,
    });
  });

  it("handles empty input without errors", async () => {
    const engine = new DefaultMatchingEngine();
    const results = await engine.match({ requesterId: "requester-1", candidates: [] });

    expect(results).toEqual([]);
  });

  it("does not mutate the incoming candidates array", async () => {
    const candidates: MatchCandidate[] = [{ profileId: "profile-1" }, { profileId: "profile-2" }];
    const context: MatchContext = { requesterId: "requester-1", candidates };

    const engine = new DefaultMatchingEngine();
    await engine.match(context);

    expect(candidates).toEqual([{ profileId: "profile-1" }, { profileId: "profile-2" }]);
  });
});
