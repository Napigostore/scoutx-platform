import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@scoutx/events";
import { InMemoryTimelineRepository } from "../src/InMemoryTimelineRepository.js";
import { TimelineService } from "../src/TimelineService.js";

const APPROVED_EVENT = {
  type: "mission.approved" as const,
  missionId: "mission-1",
  requesterId: "requester-1",
  scoutId: "scout-1",
  rewardAmount: { amountMinor: 5000, currency: "USD" },
  timestamp: "2025-01-01T00:00:00Z",
};

const REJECTED_EVENT = {
  type: "mission.rejected" as const,
  missionId: "mission-1",
  requesterId: "requester-1",
  scoutId: "scout-1",
  rejectionReason: "Low quality evidence",
  timestamp: "2025-01-02T00:00:00Z",
};

const CANCELLED_EVENT = {
  type: "mission.cancelled" as const,
  missionId: "mission-1",
  requesterId: "requester-1",
  refundAmount: { amountMinor: 5000, currency: "USD" },
  timestamp: "2025-01-03T00:00:00Z",
};

const RESUBMITTED_EVENT = {
  type: "submission.resubmitted" as const,
  missionId: "mission-1",
  scoutId: "scout-1",
  summary: "Resubmitted with better photos",
  timestamp: "2025-01-04T00:00:00Z",
};

describe("TimelineService", () => {
  describe("handleEvent", () => {
    it("should record a timeline entry for mission.approved", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      await service.handleEvent(APPROVED_EVENT);

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(1);
      expect(entries[0].eventType).toBe("mission.approved");
      expect(entries[0].missionId).toBe("mission-1");
      expect(entries[0].actorId).toBe("requester-1");
      expect(entries[0].summary).toContain("Mission approved");
      expect(entries[0].summary).toContain("scout-1");
      expect(entries[0].metadata).toEqual({
        scoutId: "scout-1",
        rewardAmountMinor: 5000,
        rewardCurrency: "USD",
      });
    });

    it("should record a timeline entry for mission.rejected", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      await service.handleEvent(REJECTED_EVENT);

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(1);
      expect(entries[0].eventType).toBe("mission.rejected");
      expect(entries[0].actorId).toBe("requester-1");
      expect(entries[0].summary).toContain("Low quality evidence");
      expect(entries[0].metadata).toEqual({
        scoutId: "scout-1",
        rejectionReason: "Low quality evidence",
      });
    });

    it("should record a timeline entry for mission.cancelled", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      await service.handleEvent(CANCELLED_EVENT);

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(1);
      expect(entries[0].eventType).toBe("mission.cancelled");
      expect(entries[0].actorId).toBe("requester-1");
      expect(entries[0].summary).toContain("refund");
      expect(entries[0].metadata).toEqual({
        refundAmountMinor: 5000,
        refundCurrency: "USD",
      });
    });

    it("should record a timeline entry for submission.resubmitted", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      await service.handleEvent(RESUBMITTED_EVENT);

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(1);
      expect(entries[0].eventType).toBe("submission.resubmitted");
      expect(entries[0].actorId).toBe("scout-1");
      expect(entries[0].summary).toContain("Resubmitted with better photos");
      expect(entries[0].metadata).toEqual({
        summary: "Resubmitted with better photos",
      });
    });

    it("should order entries by most recent first", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      await service.handleEvent(APPROVED_EVENT); // timestamp: 2025-01-01
      await service.handleEvent(REJECTED_EVENT);  // timestamp: 2025-01-02

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(2);
      expect(entries[0].eventType).toBe("mission.rejected"); // most recent first
      expect(entries[1].eventType).toBe("mission.approved");
    });
  });

  describe("subscribe", () => {
    it("should record entries for all event types published via the bus", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      service.subscribe();

      await eventBus.publish(APPROVED_EVENT);
      await eventBus.publish(REJECTED_EVENT);
      await eventBus.publish(CANCELLED_EVENT);
      await eventBus.publish(RESUBMITTED_EVENT);

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(4);
    });

    it("should not throw when an unrecognised event type is published", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      service.subscribe();

      await expect(
        eventBus.publish({
          type: "coin.released",
          userId: "u1",
          missionId: "m1",
          amount: { amountMinor: 100, currency: "USD" },
          description: "test",
          timestamp: "2025-01-01T00:00:00Z",
        }),
      ).resolves.not.toThrow();
    });

    it("should have deterministic entry IDs for idempotent-like behaviour", async () => {
      const repo = new InMemoryTimelineRepository();
      const eventBus = new InMemoryEventBus();
      const service = new TimelineService(repo, eventBus);

      // Handle the same event twice
      await service.handleEvent(APPROVED_EVENT);
      await service.handleEvent(APPROVED_EVENT); // same event, same ID

      // The repo will just overwrite since it's a Map
      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(1);
    });
  });
});
