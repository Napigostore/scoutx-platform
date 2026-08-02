import { describe, expect, it } from "vitest";
import { PrismaEvidenceRepository } from "../src/index.js";

describe("PrismaEvidenceRepository", () => {
  const repo = new PrismaEvidenceRepository();
  const missionId = "44444444-4444-4444-8444-444444444401";
  const scoutId = "00000000-0000-0000-0000-000000000004";
  const userId = "00000000-0000-0000-0000-000000000003";

  it("creates and finds an evidence record", async () => {
    const evidence = await repo.create({
      id: crypto.randomUUID(),
      missionId,
      scoutId,
      userId,
      caption: "Evidence test item",
      type: "PHOTO",
      location: "Test Location",
    });

    expect(evidence.id).toBeDefined();
    expect(evidence.caption).toBe("Evidence test item");
    expect(evidence.type).toBe("PHOTO");
    expect(evidence.verified).toBe(false);

    const found = await repo.findById(evidence.id);
    expect(found).not.toBeNull();
    expect(found!.caption).toBe("Evidence test item");
  });

  it("finds evidence by mission ID", async () => {
    const items = await repo.findByMissionId(missionId);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("finds evidence by scout ID", async () => {
    const items = await repo.findByScoutId(scoutId);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("verifies evidence", async () => {
    const evidence = await repo.create({
      id: crypto.randomUUID(),
      missionId,
      scoutId,
      userId,
      caption: "To be verified",
      type: "NOTE",
    });

    expect(evidence.verified).toBe(false);

    const verified = await repo.verify(evidence.id);
    expect(verified).toBe(true);

    const found = await repo.findById(evidence.id);
    expect(found!.verified).toBe(true);
  });

  it("counts evidence by mission ID", async () => {
    const count = await repo.countByMissionId(missionId);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("deletes evidence", async () => {
    const evidence = await repo.create({
      id: crypto.randomUUID(),
      missionId,
      scoutId,
      userId,
      caption: "To be deleted",
      type: "PHOTO",
    });

    const deleted = await repo.delete(evidence.id);
    expect(deleted).toBe(true);

    const found = await repo.findById(evidence.id);
    expect(found).toBeNull();
  });

  it("returns null for non-existent evidence", async () => {
    const found = await repo.findById("00000000-0000-0000-0000-000000000999");
    expect(found).toBeNull();
  });
});
