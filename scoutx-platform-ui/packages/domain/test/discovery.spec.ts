import { describe, expect, it } from "vitest";

import { createDiscoverySignal } from "../src/index.js";

describe("discovery signals", () => {
  it("builds a signal with the expected shape", () => {
    const signal = createDiscoverySignal({
      kind: "mission",
      score: 0.84,
      reason: "Fresh scout availability",
    });

    expect(signal).toMatchObject({
      kind: "mission",
      score: 0.84,
      reason: "Fresh scout availability",
    });
  });
});
