import type { CoinLedger } from "./CoinLedger.js";
import type { CoinTransaction } from "./CoinTransaction.js";

/**
 * In-memory implementation of CoinLedger for testing.
 * Ensures idempotency by tracking transaction IDs already recorded.
 */
export class InMemoryCoinLedger implements CoinLedger {
  private transactions = new Map<string, CoinTransaction>();

  async record(transaction: CoinTransaction): Promise<boolean> {
    if (this.transactions.has(transaction.id)) {
      return false; // duplicate; idempotent
    }
    this.transactions.set(transaction.id, transaction);
    return true;
  }

  async findById(id: string): Promise<CoinTransaction | null> {
    return this.transactions.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<readonly CoinTransaction[]> {
    return Array.from(this.transactions.values()).filter((t) => t.userId === userId);
  }

  async getBalance(userId: string): Promise<number> {
    const userTxs = Array.from(this.transactions.values()).filter((t) => t.userId === userId);
    return userTxs.reduce((sum, t) => sum + t.amountMinor, 0);
  }
}
