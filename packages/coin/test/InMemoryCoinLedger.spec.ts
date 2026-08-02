import { describe, expect, it } from "vitest";
import { InMemoryCoinLedger } from "../src/InMemoryCoinLedger.js";
import type { CoinTransaction } from "../src/CoinTransaction.js";

function makeTx(overrides: Partial<CoinTransaction> = {}): CoinTransaction {
  return {
    id: "tx-1",
    userId: "user-1",
    amountMinor: 50,
    currency: "USD",
    reason: "reward",
    description: "Test transaction",
    eventType: "mission.approved",
    missionId: "mission-1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("InMemoryCoinLedger", () => {
  describe("record", () => {
    it("should record a new transaction", async () => {
      const ledger = new InMemoryCoinLedger();
      const tx = makeTx();

      const result = await ledger.record(tx);

      expect(result).toBe(true);
      const found = await ledger.findById(tx.id);
      expect(found).toEqual(tx);
    });

    it("should reject duplicate transaction IDs (idempotent)", async () => {
      const ledger = new InMemoryCoinLedger();
      const tx = makeTx();

      await ledger.record(tx);
      const result = await ledger.record(tx);

      expect(result).toBe(false);
    });
  });

  describe("findById", () => {
    it("should return null for non-existent transaction", async () => {
      const ledger = new InMemoryCoinLedger();
      const found = await ledger.findById("non-existent");
      expect(found).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should return all transactions for a user", async () => {
      const ledger = new InMemoryCoinLedger();

      await ledger.record(makeTx({ id: "tx-1", userId: "user-1", amountMinor: 50 }));
      await ledger.record(makeTx({ id: "tx-2", userId: "user-1", amountMinor: -10 }));
      await ledger.record(makeTx({ id: "tx-3", userId: "user-2", amountMinor: 100 }));

      const user1Txs = await ledger.findByUserId("user-1");
      expect(user1Txs).toHaveLength(2);
      expect(user1Txs.map((t) => t.id)).toEqual(["tx-1", "tx-2"]);
    });

    it("should return empty array for user with no transactions", async () => {
      const ledger = new InMemoryCoinLedger();
      const txs = await ledger.findByUserId("non-existent");
      expect(txs).toEqual([]);
    });
  });

  describe("getBalance", () => {
    it("should compute the correct balance from all transactions", async () => {
      const ledger = new InMemoryCoinLedger();

      await ledger.record(makeTx({ id: "tx-1", userId: "user-1", amountMinor: 50 }));
      await ledger.record(makeTx({ id: "tx-2", userId: "user-1", amountMinor: 30 }));
      await ledger.record(makeTx({ id: "tx-3", userId: "user-1", amountMinor: -20 }));

      const balance = await ledger.getBalance("user-1");
      expect(balance).toBe(60);
    });

    it("should return 0 for user with no transactions", async () => {
      const ledger = new InMemoryCoinLedger();
      const balance = await ledger.getBalance("non-existent");
      expect(balance).toBe(0);
    });
  });
});
