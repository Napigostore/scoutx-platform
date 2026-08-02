import { describe, expect, it } from "vitest";
import { PrismaTrustRepository } from "../src/index.js";

describe("PrismaTrustRepository", () => {
  const repo = new PrismaTrustRepository();
  const userId = "00000000-0000-0000-0000-000000000003";
  const targetId = "00000000-0000-0000-0000-000000000002";

  it("upserts a trust score for a user", async () => {
    const score = await repo.upsertScore(userId, 85);
    expect(score.userId).toBe(userId);
    expect(score.score).toBe(85);
    expect(score.createdAt).toBeDefined();
    expect(score.updatedAt).toBeDefined();
  });

  it("updates an existing trust score", async () => {
    const score = await repo.upsertScore(userId, 92);
    expect(score.score).toBe(92);
  });

  it("finds a trust score by user ID", async () => {
    const score = await repo.findScoreByUserId(userId);
    expect(score).not.toBeNull();
    expect(score!.score).toBe(92);
  });

  it("returns null for non-existent trust score", async () => {
    const score = await repo.findScoreByUserId("00000000-0000-0000-0000-000000009999");
    expect(score).toBeNull();
  });

  it("creates a trust action", async () => {
    const action = await repo.createAction({
      id: crypto.randomUUID(),
      actorId: userId,
      targetId,
      action: "ENDORSED",
    });

    expect(action.id).toBeDefined();
    expect(action.actorId).toBe(userId);
    expect(action.targetId).toBe(targetId);
    expect(action.action).toBe("ENDORSED");
    expect(action.missionId).toBeNull();
  });

  it("creates a trust action with mission reference", async () => {
    const action = await repo.createAction({
      id: crypto.randomUUID(),
      actorId: userId,
      targetId,
      action: "VERIFIED",
      missionId: "44444444-4444-4444-8444-444444444401",
    });

    expect(action.missionId).toBe("44444444-4444-4444-8444-444444444401");
  });

  it("finds actions by target ID", async () => {
    const actions = await repo.findActionsByTargetId(targetId);
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[0].targetId).toBe(targetId);
  });

  it("finds actions by actor ID", async () => {
    const actions = await repo.findActionsByActorId(userId);
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[0].actorId).toBe(userId);
  });

  it("counts actions by target ID", async () => {
    const count = await repo.countActionsByTargetId(targetId);
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
