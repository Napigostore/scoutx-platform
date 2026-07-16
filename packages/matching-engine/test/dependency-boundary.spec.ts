import { describe, expect, it } from "vitest";

import type { MatchCandidate, MatchContext, MatchResult, MatchingEngine } from "../src/index.js";

describe("dependency boundary", () => {
  it("keeps contracts shape minimal and framework-free", () => {
    const candidate: MatchCandidate = { profileId: "profile-1" };
    const context: MatchContext = { requesterId: "requester-1", candidates: [candidate] };
    const result: MatchResult = {
      candidate,
      score: 0.8,
      breakdown: { relevance: 0.8, compatibility: 0.8, freshness: 0.8 },
    };

    const engine: MatchingEngine = {
      match: async () => [result],
    };

    expect(context.candidates).toHaveLength(1);
    expect(engine.match(context)).toBeInstanceOf(Promise);
  });
});
