import { describe, expect, it } from "vitest";
import { PrismaTimelineRepository } from "../src/index.js";

describe("PrismaTimelineRepository", () => {
  const repo = new PrismaTimelineRepository();
  const missionId = "44444444-4444-4444-8444-444444444401";

  it("creates and finds a timeline entry", async () => {
    const entry = await repo.create({
      id: crypto.randomUUID(),
      missionId,
      eventType: "test.event",
      summary: "Test timeline entry",
      actorId: "00000000-0000-0000-0000-000000000003",
    });

    expect(entry.id).toBeDefined();
    expect(entry.eventType).toBe("test.event");
    expect(entry.summary).toBe("Test timeline entry");
    expect(entry.actorId).toBe("00000000-0000-0000-0000-000000000003");

    const found = await repo.findById(entry.id);
    expect(found).not.toBeNull();
    expect(found!.summary).toBe("Test timeline entry");
  });

  it("creates entry with metadata", async () => {
    const entry = await repo.create({
      id: crypto.randomUUID(),
      missionId,
      eventType: "test.with.metadata",
      summary: "Entry with metadata",
      metadata: { key: "value", count: 42 },
    });

    expect(entry.metadata).toEqual({ key: "value", count: 42 });
  });

  it("finds entries by mission ID ordered by createdAt ascending", async () => {
    const entries = await repo.findByMissionId(missionId);
    expect(entries.length).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        entries[i - 1].createdAt.getTime(),
      );
    }
  });

  it("finds entries since a given date", async () => {
    const since = new Date(Date.now() - 60_000); // 1 minute ago
    const entries = await repo.findByMissionIdSince(missionId, since);
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  it("counts entries by mission ID", async () => {
    const count = await repo.countByMissionId(missionId);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("deletes a timeline entry", async () => {
    const entry = await repo.create({
      id: crypto.randomUUID(),
      missionId,
      eventType: "test.to_delete",
      summary: "Delete me",
    });

    const deleted = await repo.delete(entry.id);
    expect(deleted).toBe(true);

    const found = await repo.findById(entry.id);
    expect(found).toBeNull();
  });

  it("returns null for non-existent entry", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000999");
    expect(found).toBeNull();
  });
});
