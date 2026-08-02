import type {
  EventBus,
  CoinReleasedEvent,
  CoinRefundedEvent,
  MissionApprovedEvent,
  MissionCancelledEvent,
} from "@scoutx/events";
import type { CoinLedger } from "./CoinLedger.js";
import type { CoinTransaction } from "./CoinTransaction.js";

/**
 * Service that issues coin rewards and refunds in response to
 * mission domain events.
 *
 * Reward and refund amounts are taken directly from the event's Money value
 * objects. The engine publishes typed coin events (coin.released / coin.refunded).
 */
export class CoinService {
  constructor(
    private readonly ledger: CoinLedger,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Subscribe to relevant mission domain events.
   */
  subscribe(): void {
    this.eventBus.subscribe("mission.approved", (event) => {
      this.handleApproved(event as MissionApprovedEvent).catch(() => {
        // handler failure silently swallowed to avoid crashing the bus
      });
    });
    this.eventBus.subscribe("mission.cancelled", (event) => {
      this.handleCancelled(event as MissionCancelledEvent).catch(() => {
        // handler failure silently swallowed to avoid crashing the bus
      });
    });
  }

  /**
   * On mission.approved: reward the scout with the mission's budget amount.
   * Publishes a coin.released event (only if the transaction was recorded,
   * i.e. not a duplicate).
   */
  async handleApproved(event: MissionApprovedEvent): Promise<void> {
    const amount = event.rewardAmount;
    const txId = `reward-mission.approved-${event.missionId}`;

    const transaction: CoinTransaction = {
      id: txId,
      userId: event.scoutId,
      amountMinor: amount.amountMinor,
      currency: amount.currency,
      reason: "reward",
      description: `Reward for mission ${event.missionId}`,
      eventType: event.type,
      missionId: event.missionId,
      createdAt: new Date().toISOString(),
    };

    const recorded = await this.ledger.record(transaction);
    if (recorded) {
      const coinEvent: CoinReleasedEvent = {
        type: "coin.released",
        userId: event.scoutId,
        missionId: event.missionId,
        amount,
        description: `Reward for mission ${event.missionId}`,
        timestamp: transaction.createdAt,
      };
      await this.eventBus.publish(coinEvent);
    }
  }

  /**
   * On mission.cancelled: refund the requester's escrowed budget.
   * Publishes a coin.refunded event (only if the transaction was recorded,
   * i.e. not a duplicate).
   */
  async handleCancelled(event: MissionCancelledEvent): Promise<void> {
    const amount = event.refundAmount;
    const txId = `refund-mission.cancelled-${event.missionId}`;

    const transaction: CoinTransaction = {
      id: txId,
      userId: event.requesterId,
      amountMinor: amount.amountMinor,
      currency: amount.currency,
      reason: "refund",
      description: `Refund for cancelled mission ${event.missionId}`,
      eventType: event.type,
      missionId: event.missionId,
      createdAt: new Date().toISOString(),
    };

    const recorded = await this.ledger.record(transaction);
    if (recorded) {
      const coinEvent: CoinRefundedEvent = {
        type: "coin.refunded",
        userId: event.requesterId,
        missionId: event.missionId,
        amount,
        description: `Refund for cancelled mission ${event.missionId}`,
        timestamp: transaction.createdAt,
      };
      await this.eventBus.publish(coinEvent);
    }
  }
}
