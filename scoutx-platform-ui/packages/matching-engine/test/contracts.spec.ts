import { describe, expect, it } from "vitest";

import { createScoreBreakdown, scoreFromBreakdown } from "../src/index.js";

describe("matching engine contracts", () => {
  it("keeps scores within the defined range", () => {
    const breakdown = createScoreBreakdown({ relevance: 1, compatibility: 0.2, freshness: 0.3 });
    const score = scoreFromBreakdown(breakdown);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("creates a default breakdown", () => {
    expect(createScoreBreakdown()).toEqual({
      relevance: 0.5,
      compatibility: 0.5,
      freshness: 0.5,
    });
  });
});
