import { describe, expect, it } from "vitest";

import { canTransitionMissionStatus, MissionStatus } from "../src/index.js";

describe("mission lifecycle", () => {
  it("allows a draft to become published", () => {
    expect(canTransitionMissionStatus(MissionStatus.DRAFT, MissionStatus.PUBLISHED)).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionMissionStatus(MissionStatus.COMPLETED, MissionStatus.PUBLISHED)).toBe(
      false,
    );
  });
});
