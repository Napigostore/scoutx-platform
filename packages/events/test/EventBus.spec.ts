import { describe, expect, it, vi } from "vitest";
import { InMemoryEventBus } from "../src/EventBus.js";

describe("InMemoryEventBus", () => {
  it("should deliver event to subscribed handler by type", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    bus.subscribe("mission.approved", handler);

    await bus.publish({
      type: "mission.approved",
      missionId: "m1",
      requesterId: "r1",
      scoutId: "s1",
      timestamp: "2025-01-01T00:00:00Z",
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mission.approved", missionId: "m1" }),
    );
  });

  it("should not deliver event to handler subscribed to different type", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    bus.subscribe("mission.rejected", handler);

    await bus.publish({
      type: "mission.approved",
      missionId: "m1",
      requesterId: "r1",
      scoutId: "s1",
      timestamp: "2025-01-01T00:00:00Z",
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should support multiple handlers for same event type", async () => {
    const bus = new InMemoryEventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.subscribe("submission.resubmitted", h1);
    bus.subscribe("submission.resubmitted", h2);

    await bus.publish({
      type: "submission.resubmitted",
      missionId: "m1",
      scoutId: "s1",
      summary: "test summary",
      timestamp: "2025-01-01T00:00:00Z",
    });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("should carry correct payload for MissionRejectedEvent", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    bus.subscribe("mission.rejected", handler);

    await bus.publish({
      type: "mission.rejected",
      missionId: "m1",
      requesterId: "r1",
      scoutId: "s1",
      rejectionReason: "Insufficient evidence",
      timestamp: "2025-01-01T00:00:00Z",
    });

    expect(handler).toHaveBeenCalledWith({
      type: "mission.rejected",
      missionId: "m1",
      requesterId: "r1",
      scoutId: "s1",
      rejectionReason: "Insufficient evidence",
      timestamp: "2025-01-01T00:00:00Z",
    });
  });
});
