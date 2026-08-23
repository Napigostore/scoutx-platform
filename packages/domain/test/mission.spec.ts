import { describe, expect, it } from "vitest";

import {
  canTransitionMissionStatus,
  assertMissionStatusTransition,
  isTerminalMissionStatus,
  MissionStatus,
} from "../src/index.js";

describe("mission lifecycle state machine", () => {
  it("allows valid forward transitions across the full lifecycle", () => {
    // OPEN (PUBLISHED) -> MATCHED (ACCEPTED)
    expect(canTransitionMissionStatus(MissionStatus.PUBLISHED, MissionStatus.ACCEPTED)).toBe(true);

    // MATCHED (ACCEPTED) -> IN_PROGRESS
    expect(canTransitionMissionStatus(MissionStatus.ACCEPTED, MissionStatus.IN_PROGRESS)).toBe(true);

    // IN_PROGRESS -> SUBMITTED
    expect(canTransitionMissionStatus(MissionStatus.IN_PROGRESS, MissionStatus.SUBMITTED)).toBe(true);

    // SUBMITTED -> VERIFYING (VERIFIED)
    expect(canTransitionMissionStatus(MissionStatus.SUBMITTED, MissionStatus.VERIFYING)).toBe(true);

    // VERIFYING -> COMPLETED
    expect(canTransitionMissionStatus(MissionStatus.VERIFYING, MissionStatus.COMPLETED)).toBe(true);
  });

  it("blocks invalid backward or terminal transitions", () => {
    // COMPLETED terminal state cannot transition
    expect(canTransitionMissionStatus(MissionStatus.COMPLETED, MissionStatus.PUBLISHED)).toBe(false);
    expect(canTransitionMissionStatus(MissionStatus.COMPLETED, MissionStatus.IN_PROGRESS)).toBe(false);
    expect(isTerminalMissionStatus(MissionStatus.COMPLETED)).toBe(true);

    // FAILED & CANCELLED terminal states
    expect(isTerminalMissionStatus(MissionStatus.FAILED)).toBe(true);
    expect(isTerminalMissionStatus(MissionStatus.CANCELLED)).toBe(true);
    expect(canTransitionMissionStatus(MissionStatus.FAILED, MissionStatus.SUBMITTED)).toBe(false);
    expect(canTransitionMissionStatus(MissionStatus.CANCELLED, MissionStatus.IN_PROGRESS)).toBe(false);
  });

  it("assertMissionStatusTransition throws error on invalid transitions", () => {
    expect(() =>
      assertMissionStatusTransition(MissionStatus.COMPLETED, MissionStatus.IN_PROGRESS)
    ).toThrowError("Invalid mission status transition: COMPLETED -> IN_PROGRESS");

    expect(() =>
      assertMissionStatusTransition(MissionStatus.PUBLISHED, MissionStatus.ACCEPTED)
    ).not.toThrow();
  });
});
