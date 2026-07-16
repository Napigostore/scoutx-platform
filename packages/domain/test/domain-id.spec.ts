import { describe, expect, it } from "vitest";

import { createDiscoverySignal } from "../src/index.js";

describe("domain identifiers", () => {
  it("creates stable domain identifiers", () => {
    const signal = createDiscoverySignal({
      kind: "location",
      score: 0.91,
      reason: "Nearby verified venue",
    });

    expect(signal.id).toBe("location:nearby-verified-venue");
  });
});
