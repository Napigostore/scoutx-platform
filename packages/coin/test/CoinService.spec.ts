import { describe, expect, it } from "vitest";
import { InMemoryEventBus, type CoinReleasedEvent, type CoinRefundedEvent } from "@scoutx/events";
import { InMemoryCoinLedger } from "../src/InMemoryCoinLedger.js";
import { CoinService } from "../src/CoinService.js";
import type { Money } from "@scoutx/domain";

function rewardAmount(amountMinor: number, currency = "USD"): Money {
  return { amountMinor, currency };
}

describe("CoinService", () => {
  describe("handleApproved", () => {
    it("should record a reward from the event's Money value object", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      await service.handleApproved({
        type: "mission.approved",
        missionId: "mission-1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rewardAmount: rewardAmount(10000), // $100.00
        timestamp: new Date().toISOString(),
      });

      const scoutTxs = await ledger.findByUserId("scout-1");
      expect(scoutTxs).toHaveLength(1);
      expect(scoutTxs[0].amountMinor).toBe(10000);
      expect(scoutTxs[0].currency).toBe("USD");
      expect(scoutTxs[0].reason).toBe("reward");
      expect(scoutTxs[0].eventType).toBe("mission.approved");
      expect(scoutTxs[0].missionId).toBe("mission-1");
      expect(scoutTxs[0].id).toBe("reward-mission.approved-mission-1");

      const balance = await ledger.getBalance("scout-1");
      expect(balance).toBe(10000);
    });

    it("should publish a coin.released event", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      const publishedEvents: Array<{ type: string }> = [];
      eventBus.subscribe("coin.released", (event) => {
        publishedEvents.push(event);
      });

      await service.handleApproved({
        type: "mission.approved",
        missionId: "mission-1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rewardAmount: rewardAmount(5000, "USD"),
        timestamp: new Date().toISOString(),
      });

      expect(publishedEvents).toHaveLength(1);
      const released = publishedEvents[0] as CoinReleasedEvent;
      expect(released.type).toBe("coin.released");
      expect(released.userId).toBe("scout-1");
      expect(released.missionId).toBe("mission-1");
      expect(released.amount.amountMinor).toBe(5000);
      expect(released.amount.currency).toBe("USD");
    });

    it("should be idempotent: handling the same approved event twice does not double the reward nor double-publish", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      const publishedEvents: Array<{ type: string }> = [];
      eventBus.subscribe("coin.released", (event) => {
        publishedEvents.push(event);
      });

      const event = {
        type: "mission.approved" as const,
        missionId: "mission-1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rewardAmount: rewardAmount(5000),
        timestamp: new Date().toISOString(),
      };

      await service.handleApproved(event);
      await service.handleApproved(event);

      const balance = await ledger.getBalance("scout-1");
      expect(balance).toBe(5000); // still only 5000

      // coin.released should only be published once
      expect(publishedEvents).toHaveLength(1);
    });
  });

  describe("handleCancelled", () => {
    it("should record a refund from the event's Money value object", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      await service.handleCancelled({
        type: "mission.cancelled",
        missionId: "mission-1",
        requesterId: "requester-1",
        refundAmount: rewardAmount(5000), // $50.00
        timestamp: new Date().toISOString(),
      });

      const requesterTxs = await ledger.findByUserId("requester-1");
      expect(requesterTxs).toHaveLength(1);
      expect(requesterTxs[0].amountMinor).toBe(5000);
      expect(requesterTxs[0].currency).toBe("USD");
      expect(requesterTxs[0].reason).toBe("refund");
      expect(requesterTxs[0].eventType).toBe("mission.cancelled");
      expect(requesterTxs[0].missionId).toBe("mission-1");
      expect(requesterTxs[0].id).toBe("refund-mission.cancelled-mission-1");

      const balance = await ledger.getBalance("requester-1");
      expect(balance).toBe(5000);
    });

    it("should publish a coin.refunded event", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      const publishedEvents: Array<{ type: string }> = [];
      eventBus.subscribe("coin.refunded", (event) => {
        publishedEvents.push(event);
      });

      await service.handleCancelled({
        type: "mission.cancelled",
        missionId: "mission-1",
        requesterId: "requester-1",
        refundAmount: rewardAmount(2500, "EUR"),
        timestamp: new Date().toISOString(),
      });

      expect(publishedEvents).toHaveLength(1);
      const refunded = publishedEvents[0] as CoinRefundedEvent;
      expect(refunded.type).toBe("coin.refunded");
      expect(refunded.userId).toBe("requester-1");
      expect(refunded.missionId).toBe("mission-1");
      expect(refunded.amount.amountMinor).toBe(2500);
      expect(refunded.amount.currency).toBe("EUR");
    });

    it("should be idempotent: handling the same cancelled event twice does not double the refund nor double-publish", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      const publishedEvents: Array<{ type: string }> = [];
      eventBus.subscribe("coin.refunded", (event) => {
        publishedEvents.push(event);
      });

      const event = {
        type: "mission.cancelled" as const,
        missionId: "mission-1",
        requesterId: "requester-1",
        refundAmount: rewardAmount(5000),
        timestamp: new Date().toISOString(),
      };

      await service.handleCancelled(event);
      await service.handleCancelled(event);

      const balance = await ledger.getBalance("requester-1");
      expect(balance).toBe(5000); // still only 5000

      expect(publishedEvents).toHaveLength(1);
    });
  });

  describe("subscribe", () => {
    it("should handle mission.approved events delivered via the event bus", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      service.subscribe();

      await eventBus.publish({
        type: "mission.approved",
        missionId: "mission-1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rewardAmount: rewardAmount(5000),
        timestamp: new Date().toISOString(),
      });

      const balance = await ledger.getBalance("scout-1");
      expect(balance).toBe(5000);
    });

    it("should handle mission.cancelled events delivered via the event bus", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

      service.subscribe();

      await eventBus.publish({
        type: "mission.cancelled",
        missionId: "mission-1",
        requesterId: "requester-1",
        refundAmount: rewardAmount(5000),
        timestamp: new Date().toISOString(),
      });

      const balance = await ledger.getBalance("requester-1");
      expect(balance).toBe(5000);
    });

    it("should not throw when an unsubscribed event type is published", async () => {
      const ledger = new InMemoryCoinLedger();
      const eventBus = new InMemoryEventBus();
      const service = new CoinService(ledger, eventBus);

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

