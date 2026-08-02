import type { Money } from "@scoutx/domain";

/**
 * Emitted when coins are released to a user as a reward.
 */
export interface CoinReleasedEvent {
  type: "coin.released";
  userId: string;
  missionId: string;
  amount: Money;
  description: string;
  timestamp: string;
}

/**
 * Emitted when coins are refunded to a user.
 */
export interface CoinRefundedEvent {
  type: "coin.refunded";
  userId: string;
  missionId: string;
  amount: Money;
  description: string;
  timestamp: string;
}

/**
 * Union of all coin domain events.
 */
export type CoinDomainEvent = CoinReleasedEvent | CoinRefundedEvent;
