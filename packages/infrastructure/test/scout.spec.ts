import { describe, expect, it } from "vitest";
import { PrismaScoutRepository } from "../src/index.js";
import type { ScoutProfile, MissionCategory } from "@scoutx/types";

describe("PrismaScoutRepository", () => {
  const repo = new PrismaScoutRepository();
  const profileId = "00000000-0000-0000-0000-000000000004";

  it("finds scout by ID", async () => {
    const scout = await repo.findById(profileId);
    expect(scout).not.toBeNull();
    expect(scout!.id).toBe(profileId);
    expect(scout!.displayName).toBeDefined();
  });

  it("finds scout by user ID", async () => {
    const scout = await repo.findByUserId("00000000-0000-0000-0000-000000000003");
    expect(scout).not.toBeNull();
    expect(scout!.userId).toBe("00000000-0000-0000-0000-000000000003");
  });

  it("finds available scouts", async () => {
    const scouts = await repo.findAvailable({});
    expect(scouts.length).toBeGreaterThanOrEqual(1);
  });

  it("filters available scouts by categories", async () => {
    const scouts = await repo.findAvailable({
      categories: ["STREET_CONDITIONS"],
    });
    expect(scouts.length).toBeGreaterThanOrEqual(0);
  });

  it("updates a scout profile", async () => {
    const scout = await repo.findById(profileId);
    if (!scout) throw new Error("Scout not found");

    const updated: ScoutProfile = {
      ...scout,
      bio: "Updated bio for testing",
      tags: ["test-tag"],
    };

    await repo.update(updated);

    const found = await repo.findById(profileId);
    expect(found!.bio).toBe("Updated bio for testing");
    expect(found!.tags).toContain("test-tag");
  });

  it("updates scout location", async () => {
    await repo.updateLocation(profileId, 35.7, 139.7);

    const scout = await repo.findById(profileId);
    expect(scout!.currentCoordinates).not.toBeNull();
    expect(scout!.currentCoordinates!.latitude).toBeCloseTo(35.7, 1);
    expect(scout!.currentCoordinates!.longitude).toBeCloseTo(139.7, 1);
  });

  it("increments completed missions", async () => {
    const before = await repo.findById(profileId);
    const prevCount = before!.completedMissions;

    const newCount = await repo.incrementCompletedMissions(profileId);
    expect(newCount).toBe(prevCount + 1);
  });

  it("counts total scouts", async () => {
    const count = await repo.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("returns null for non-existent scout", async () => {
    const scout = await repo.findById("00000000-0000-0000-0000-000000009999");
    expect(scout).toBeNull();

    const scoutByUser = await repo.findByUserId("00000000-0000-0000-0000-000000009999");
    expect(scoutByUser).toBeNull();
  });
});
