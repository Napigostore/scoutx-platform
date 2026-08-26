import { describe, expect, it } from "vitest";
import { PrismaCoinRepository } from "../src/index.js";

describe("PrismaCoinRepository", () => {
  const repo = new PrismaCoinRepository();
  const userId = "00000000-0000-0000-0000-000000000003";
  const missionId = "44444444-4444-4444-8444-444444444401";

  it("creates a positive coin transaction", async () => {
    const tx = await repo.create({
      id: crypto.randomUUID(),
      userId,
      amountCents: 5000,
      reason: "reward",
      description: "Mission completion bonus",
      eventType: "mission.completed",
      missionId,
    });

    expect(tx.id).toBeDefined();
    expect(tx.amountCents).toBe(5000);
    expect(tx.reason).toBe("reward");
    expect(tx.currency).toBe("COIN");
    expect(tx.missionId).toBe(missionId);
  });

  it("creates a negative coin transaction", async () => {
    const tx = await repo.create({
      id: crypto.randomUUID(),
      userId,
      amountCents: -1000,
      reason: "penalty",
      description: "Late submission penalty",
      eventType: "mission.late_submission",
      missionId,
    });

    expect(tx.amountCents).toBe(-1000);
  });

  it("finds a transaction by ID", async () => {
    const tx = await repo.create({
      id: crypto.randomUUID(),
      userId,
      amountCents: 2500,
      reason: "reward",
      eventType: "evidence.verified",
      missionId,
    });

    const found = await repo.findById(tx.id);
    expect(found).not.toBeNull();
    expect(found!.amountCents).toBe(2500);
  });

  it("finds transactions by user ID", async () => {
    const txs = await repo.findByUserId(userId);
    expect(txs.length).toBeGreaterThanOrEqual(3);
  });

  it("finds transactions by mission ID", async () => {
    const txs = await repo.findByMissionId(missionId);
    expect(txs.length).toBeGreaterThanOrEqual(3);
  });

  it("calculates balance by user ID", async () => {
    const balance = await repo.balanceByUserId(userId);
    // 5000 - 1000 + 2500 = 6500
    expect(balance).toBeGreaterThanOrEqual(6500);
  });

  it("calculates sum by mission ID", async () => {
    const sum = await repo.sumByMissionId(missionId);
    // 5000 - 1000 + 2500 = 6500
    expect(sum).toBeGreaterThanOrEqual(6500);
  });

  it("counts transactions by user ID", async () => {
    const count = await repo.countByUserId(userId);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("returns null for non-existent transaction", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000999");
    expect(found).toBeNull();
  });

  it("returns zero balance for user with no transactions", async () => {
    const balance = await repo.balanceByUserId("00000000-0000-0000-0000-000000009999");
    expect(balance).toBe(0);
  });
});
