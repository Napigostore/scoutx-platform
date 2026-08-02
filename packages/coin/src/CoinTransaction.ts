/**
 * Represents a single coin ledger entry.
 */
export interface CoinTransaction {
  /**
   * Unique transaction ID (used for idempotency).
   * Derived from the source event, e.g. "reward-mission.approved-{missionId}".
   */
  id: string;

  /**
   * The user who receives or loses coins.
   */
  userId: string;

  /**
   * Amount in minor currency unit (e.g. cents). Positive for rewards,
   * negative for penalties (if any).
   */
  amountMinor: number;

  /**
   * ISO 4217 currency code (e.g. "USD", "COIN").
   */
  currency: string;

  /**
   * Reason/category for the transaction.
   */
  reason: "reward" | "refund";

  /**
   * A human-readable description.
   */
  description: string;

  /**
   * Reference to the originating event.
   */
  eventType: string;

  /**
   * Reference to the originating mission.
   */
  missionId: string;

  /**
   * When the transaction was recorded.
   */
  createdAt: string;
}
