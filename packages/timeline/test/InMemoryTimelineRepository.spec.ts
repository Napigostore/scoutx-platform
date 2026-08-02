import { describe, expect, it } from "vitest";
import { InMemoryTimelineRepository } from "../src/InMemoryTimelineRepository.js";
import type { TimelineEntry } from "../src/TimelineEntry.js";

function makeEntry(overrides: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: "entry-1",
    missionId: "mission-1",
    eventType: "mission.approved",
    summary: "Mission approved",
    actorId: "requester-1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("InMemoryTimelineRepository", () => {
  describe("save", () => {
    it("should save a new entry", async () => {
      const repo = new InMemoryTimelineRepository();
      const entry = makeEntry();

      await repo.save(entry);
      const found = await repo.findById(entry.id);
      expect(found).toEqual(entry);
    });
  });

  describe("findById", () => {
    it("should return null for non-existent entry", async () => {
      const repo = new InMemoryTimelineRepository();
      const found = await repo.findById("non-existent");
      expect(found).toBeNull();
    });
  });

  describe("findByMissionId", () => {
    it("should return all entries for a mission ordered by most recent first", async () => {
      const repo = new InMemoryTimelineRepository();

      await repo.save(makeEntry({ id: "e1", missionId: "mission-1", createdAt: "2025-01-01T00:00:00Z" }));
      await repo.save(makeEntry({ id: "e2", missionId: "mission-1", createdAt: "2025-01-03T00:00:00Z" }));
      await repo.save(makeEntry({ id: "e3", missionId: "mission-2", createdAt: "2025-01-02T00:00:00Z" }));

      const entries = await repo.findByMissionId("mission-1");
      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe("e2"); // most recent first
      expect(entries[1].id).toBe("e1");
    });

    it("should return empty array for mission with no entries", async () => {
      const repo = new InMemoryTimelineRepository();
      const entries = await repo.findByMissionId("non-existent");
      expect(entries).toEqual([]);
    });
  });

  describe("findByUserId", () => {
    it("should return all entries for a user ordered by most recent first", async () => {
      const repo = new InMemoryTimelineRepository();

      await repo.save(makeEntry({ id: "e1", actorId: "user-1", createdAt: "2025-01-01T00:00:00Z" }));
      await repo.save(makeEntry({ id: "e2", actorId: "user-1", createdAt: "2025-01-03T00:00:00Z" }));
      await repo.save(makeEntry({ id: "e3", actorId: "user-2", createdAt: "2025-01-02T00:00:00Z" }));

      const entries = await repo.findByUserId("user-1");
      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe("e2"); // most recent first
      expect(entries[1].id).toBe("e1");
    });

    it("should return empty array for user with no entries", async () => {
      const repo = new InMemoryTimelineRepository();
      const entries = await repo.findByUserId("non-existent");
      expect(entries).toEqual([]);
    });
  });
});
