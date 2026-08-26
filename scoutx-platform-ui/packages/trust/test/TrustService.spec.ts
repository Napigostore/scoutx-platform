import { describe, expect, it, vi } from "vitest";
import { InMemoryEventBus } from "@scoutx/events";
import { TrustScoreCalculator } from "../src/TrustScoreCalculator.js";
import { TrustService } from "../src/TrustService.js";
import type { TrustRepository, TrustScore } from "../src/TrustService.js";
import type { MissionApprovedEvent, MissionRejectedEvent } from "@scoutx/events";

interface InMemoryTrustRepo extends TrustRepository {
  getStore(): Map<string, TrustScore>;
}

function createInMemoryTrustRepo(): InMemoryTrustRepo {
  const store = new Map<string, TrustScore>();
  return {
    getStore: () => store,
    findById: vi.fn(async (userId: string) => store.get(userId) ?? null),
    save: vi.fn(async (ts: TrustScore) => {
      store.set(ts.userId, ts);
    }),
  };
}

describe("TrustService", () => {
  describe("handleEvent - mission.approved", () => {
    it("should increase scout trust by +5 and requester by +1", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(calculator.calculateOnApproval()) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      repo.getStore().set("scout-1", { userId: "scout-1", score: 50 });
      repo.getStore().set("requester-1", { userId: "requester-1", score: 70 });

      const event: MissionApprovedEvent = {
        type: "mission.approved",
        missionId: "m1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        timestamp: new Date().toISOString(),
      };

      await service.handleEvent(event);

      expect(repo.save).toHaveBeenCalledWith({ userId: "scout-1", score: 55 });
      expect(repo.save).toHaveBeenCalledWith({ userId: "requester-1", score: 71 });
    });

    it("should do nothing when policy returns null", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(null) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      repo.getStore().set("scout-1", { userId: "scout-1", score: 50 });

      const event: MissionApprovedEvent = {
        type: "mission.approved",
        missionId: "m1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        timestamp: new Date().toISOString(),
      };

      await service.handleEvent(event);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it("should handle missing scout trust record gracefully", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(calculator.calculateOnApproval()) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      repo.getStore().set("requester-1", { userId: "requester-1", score: 70 });

      const event: MissionApprovedEvent = {
        type: "mission.approved",
        missionId: "m1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        timestamp: new Date().toISOString(),
      };

      await service.handleEvent(event);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.save).toHaveBeenCalledWith({ userId: "requester-1", score: 71 });
    });
  });

  describe("handleEvent - mission.rejected", () => {
    it("should decrease scout trust by -3 and not change requester", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(calculator.calculateOnRejection()) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      repo.getStore().set("scout-1", { userId: "scout-1", score: 50 });
      repo.getStore().set("requester-1", { userId: "requester-1", score: 70 });

      const event: MissionRejectedEvent = {
        type: "mission.rejected",
        missionId: "m1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rejectionReason: "Poor quality",
        timestamp: new Date().toISOString(),
      };

      await service.handleEvent(event);

      expect(repo.save).toHaveBeenCalledWith({ userId: "scout-1", score: 47 });
      expect(repo.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: "requester-1" }),
      );
    });

    it("should clamp scout trust to 0 when score would go below 0", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(calculator.calculateOnRejection()) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      repo.getStore().set("scout-1", { userId: "scout-1", score: 2 });

      const event: MissionRejectedEvent = {
        type: "mission.rejected",
        missionId: "m1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rejectionReason: "Invalid evidence",
        timestamp: new Date().toISOString(),
      };

      await service.handleEvent(event);

      expect(repo.save).toHaveBeenCalledWith({ userId: "scout-1", score: 0 });
    });
  });

  describe("subscribe", () => {
    it("should handle events delivered via the event bus", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(calculator.calculateOnApproval()) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      repo.getStore().set("scout-1", { userId: "scout-1", score: 50 });
      repo.getStore().set("requester-1", { userId: "requester-1", score: 70 });

      service.subscribe();

      await eventBus.publish({
        type: "mission.approved",
        missionId: "m1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        timestamp: new Date().toISOString(),
      });

      expect(policy.evaluate).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "scout-1", score: 55 }),
      );
    });

    it("should not throw when an unsubscribed event type is published", async () => {
      const eventBus = new InMemoryEventBus();
      const repo = createInMemoryTrustRepo();
      const calculator = new TrustScoreCalculator();
      const policy = { evaluate: vi.fn().mockReturnValue(null) };
      const service = new TrustService(repo, calculator, eventBus, policy);

      service.subscribe();

      await expect(
        eventBus.publish({
          type: "submission.resubmitted",
          missionId: "m1",
          scoutId: "scout-1",
          summary: "test",
          timestamp: new Date().toISOString(),
        }),
      ).resolves.not.toThrow();
    });
  });
});
