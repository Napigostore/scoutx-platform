import type { CoinTransaction } from "./CoinTransaction.js";

/**
 * Ledger for recording and querying coin transactions.
 * Supports idempotent inserts: repeating the same transaction ID is a no-op.
 */
export interface CoinLedger {
  /**
   * Record a new transaction. Must be idempotent: calling with the same
   * transaction ID twice should not create a duplicate entry.
   *
   * @returns true if the transaction was recorded; false if it was a duplicate.
   */
  record(transaction: CoinTransaction): Promise<boolean>;

  /**
   * Retrieve a transaction by its unique id.
   */
  findById(id: string): Promise<CoinTransaction | null>;

  /**
   * Get all transactions for a given user.
   */
  findByUserId(userId: string): Promise<readonly CoinTransaction[]>;

  /**
   * Get the current balance for a user (sum of all transaction amounts).
   */
  getBalance(userId: string): Promise<number>;
}
