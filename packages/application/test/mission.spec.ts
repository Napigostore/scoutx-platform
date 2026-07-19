import { describe, expect, it } from "vitest";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";
import { PrismaClient } from "@prisma/client";
import {
  CreateMissionUseCase,
  ListRequesterMissionsUseCase,
  GetMissionDetailsUseCase,
  UpdateMissionUseCase,
  CancelMissionUseCase,
  PublishMissionUseCase,
  ListAvailableMissionsUseCase,
  GetAvailableMissionDetailsUseCase,
  ClaimMissionUseCase,
  ListScoutAssignedMissionsUseCase,
  GetScoutAssignedMissionDetailsUseCase,
  StartMissionUseCase,
  CreateMissionSubmissionUseCase,
} from "../src/index.js";

describe("Mission Use Cases", () => {
  const missionRepo = new PrismaMissionRepository();
  const prisma = new PrismaClient();

  const createMissionUseCase = new CreateMissionUseCase(missionRepo);
  const listRequesterMissionsUseCase = new ListRequesterMissionsUseCase(missionRepo);
  const getMissionDetailsUseCase = new GetMissionDetailsUseCase(missionRepo);
  const updateMissionUseCase = new UpdateMissionUseCase(missionRepo);
  const cancelMissionUseCase = new CancelMissionUseCase(missionRepo);
  const publishMissionUseCase = new PublishMissionUseCase(missionRepo);
  const listAvailableMissionsUseCase = new ListAvailableMissionsUseCase(missionRepo);
  const getAvailableMissionDetailsUseCase = new GetAvailableMissionDetailsUseCase(missionRepo);
  const claimMissionUseCase = new ClaimMissionUseCase(missionRepo);
  const listScoutAssignedMissionsUseCase = new ListScoutAssignedMissionsUseCase(missionRepo);
  const getScoutAssignedMissionDetailsUseCase = new GetScoutAssignedMissionDetailsUseCase(
    missionRepo,
  );
  const startMissionUseCase = new StartMissionUseCase(missionRepo);
  const createMissionSubmissionUseCase = new CreateMissionSubmissionUseCase(missionRepo);

  const sampleInput = {
    title: "Test Mission Title",
    description: "This is a test mission description with sufficient length.",
    category: "STREET_CONDITIONS" as const,
    urgency: "NORMAL" as const,
    budget: {
      amountCents: 5000,
      currency: "USD",
    },
    locationId: "00000000-0000-0000-0000-000000000001",
    coordinates: {
      latitude: 35.658034,
      longitude: 139.701636,
    },
    radiusMeters: 1500,
    requiredTags: ["test"],
    expiresAt: new Date(Date.now() + 86400000),
  };

  it("should allow a requester to create, list, view, update, publish, and cancel a mission", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";

    // 1. Create Mission
    const created = await createMissionUseCase.execute(sampleInput, requesterId, "REQUESTER");
    expect(created.id).toBeDefined();
    expect(created.status).toBe("DRAFT");
    expect(created.requesterId).toBe(requesterId);

    // 2. List Missions
    const list = await listRequesterMissionsUseCase.execute(requesterId, "REQUESTER");
    expect(list.length).toBeGreaterThan(0);
    const found = list.find((m) => m.id === created.id);
    expect(found).toBeDefined();

    // 3. Get Details
    const details = await getMissionDetailsUseCase.execute(created.id, requesterId, "REQUESTER");
    expect(details.title).toBe(sampleInput.title);

    // 4. Update Mission
    const updated = await updateMissionUseCase.execute(
      created.id,
      { title: "Updated Mission Title" },
      requesterId,
      "REQUESTER",
    );
    expect(updated.title).toBe("Updated Mission Title");

    // 5. Publish Mission
    const published = await publishMissionUseCase.execute(created.id, requesterId, "REQUESTER");
    expect(published.status).toBe("OPEN");

    // 6. Cancel Mission
    const cancelled = await cancelMissionUseCase.execute(created.id, requesterId, "REQUESTER");
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("should allow a scout to discover, view, claim, start, and submit a mission", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";
    const scoutId = "00000000-0000-0000-0000-000000000003";

    // 1. Create and Publish Mission
    const created = await createMissionUseCase.execute(sampleInput, requesterId, "REQUESTER");
    await publishMissionUseCase.execute(created.id, requesterId, "REQUESTER");

    // 2. Discover Available Missions
    const available = await listAvailableMissionsUseCase.execute("SCOUT");
    expect(available.length).toBeGreaterThan(0);
    const found = available.find((m) => m.id === created.id);
    expect(found).toBeDefined();

    // 3. Get Available Details
    const details = await getAvailableMissionDetailsUseCase.execute(created.id, "SCOUT");
    expect(details.id).toBe(created.id);

    // 4. Claim Mission
    const claimed = await claimMissionUseCase.execute(created.id, scoutId, "SCOUT");
    expect(claimed.status).toBe("MATCHED");
    expect(claimed.assignedScoutId).toBeDefined();

    // 5. List Assigned Missions
    const assigned = await listScoutAssignedMissionsUseCase.execute(scoutId, "SCOUT");
    expect(assigned.length).toBeGreaterThan(0);

    // 6. Get Assigned Details
    const assignedDetails = await getScoutAssignedMissionDetailsUseCase.execute(
      created.id,
      scoutId,
      "SCOUT",
    );
    expect(assignedDetails.id).toBe(created.id);

    // 7. Start Mission
    const started = await startMissionUseCase.execute(created.id, scoutId, "SCOUT");
    expect(started.status).toBe("IN_PROGRESS");

    // 8. Submit Mission Report
    const submissionInput = {
      summary: "This is a valid test submission report with sufficient length.",
      mediaUrls: ["https://example.com/evidence.jpg"],
      latitude: 35.658034,
      longitude: 139.701636,
    };
    const submission = await createMissionSubmissionUseCase.execute(
      created.id,
      submissionInput,
      scoutId,
      "SCOUT",
    );
    expect(submission).toBeDefined();

    // 9. Verify Mission status is now SUBMITTED
    const finalMission = await getMissionDetailsUseCase.execute(
      created.id,
      requesterId,
      "REQUESTER",
    );
    expect(finalMission.status).toBe("SUBMITTED");
  });

  it("should deny scout from performing requester actions", async () => {
    const scoutId = "00000000-0000-0000-0000-000000000003";

    await expect(createMissionUseCase.execute(sampleInput, scoutId, "SCOUT")).rejects.toThrow(
      AuthorizationError,
    );

    await expect(listRequesterMissionsUseCase.execute(scoutId, "SCOUT")).rejects.toThrow(
      AuthorizationError,
    );
  });

  it("should deny non-owner from viewing, updating, publishing, or cancelling a mission", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";
    const otherRequesterId = "00000000-0000-0000-0000-000000000005";

    const created = await createMissionUseCase.execute(sampleInput, requesterId, "REQUESTER");

    await expect(
      getMissionDetailsUseCase.execute(created.id, otherRequesterId, "REQUESTER"),
    ).rejects.toThrow(AuthorizationError);

    await expect(
      updateMissionUseCase.execute(created.id, { title: "Hack" }, otherRequesterId, "REQUESTER"),
    ).rejects.toThrow(AuthorizationError);

    await expect(
      publishMissionUseCase.execute(created.id, otherRequesterId, "REQUESTER"),
    ).rejects.toThrow(AuthorizationError);

    await expect(
      cancelMissionUseCase.execute(created.id, otherRequesterId, "REQUESTER"),
    ).rejects.toThrow(AuthorizationError);
  });

  it("should deny other scouts from viewing, starting, or submitting an assigned mission", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";
    const scoutId = "00000000-0000-0000-0000-000000000003";
    const otherScoutId = "00000000-0000-0000-0000-000000000006";

    const created = await createMissionUseCase.execute(sampleInput, requesterId, "REQUESTER");
    await publishMissionUseCase.execute(created.id, requesterId, "REQUESTER");
    await claimMissionUseCase.execute(created.id, scoutId, "SCOUT");

    await expect(
      getScoutAssignedMissionDetailsUseCase.execute(created.id, otherScoutId, "SCOUT"),
    ).rejects.toThrow(AuthorizationError);

    await expect(startMissionUseCase.execute(created.id, otherScoutId, "SCOUT")).rejects.toThrow(
      AuthorizationError,
    );

    const submissionInput = {
      summary: "This is a valid test submission report with sufficient length.",
      mediaUrls: ["https://example.com/evidence.jpg"],
      latitude: 35.658034,
      longitude: 139.701636,
    };
    await expect(
      createMissionSubmissionUseCase.execute(created.id, submissionInput, otherScoutId, "SCOUT"),
    ).rejects.toThrow(Error);
  });

  it("should deny claiming an expired mission", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";
    const scoutId = "00000000-0000-0000-0000-000000000003";

    const expiredInput = {
      ...sampleInput,
      expiresAt: new Date(Date.now() - 10000),
    };

    const created = await createMissionUseCase.execute(expiredInput, requesterId, "REQUESTER");
    await publishMissionUseCase.execute(created.id, requesterId, "REQUESTER");

    await expect(claimMissionUseCase.execute(created.id, scoutId, "SCOUT")).rejects.toThrow(Error);
  });

  it("should handle concurrent submit requests and allow exactly one winner", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";
    const scoutId = "00000000-0000-0000-0000-000000000003";

    // 1. Create, Publish, Claim, and Start Mission
    const created = await createMissionUseCase.execute(sampleInput, requesterId, "REQUESTER");
    await publishMissionUseCase.execute(created.id, requesterId, "REQUESTER");
    await claimMissionUseCase.execute(created.id, scoutId, "SCOUT");
    await startMissionUseCase.execute(created.id, scoutId, "SCOUT");

    // 2. Send two concurrent submit requests
    const submissionInput1 = {
      summary: "First concurrent submission report with sufficient length.",
      mediaUrls: ["https://example.com/evidence1.jpg"],
      latitude: 35.658034,
      longitude: 139.701636,
    };
    const submissionInput2 = {
      summary: "Second concurrent submission report with sufficient length.",
      mediaUrls: ["https://example.com/evidence2.jpg"],
      latitude: 35.658034,
      longitude: 139.701636,
    };

    const results = await Promise.allSettled([
      createMissionSubmissionUseCase.execute(created.id, submissionInput1, scoutId, "SCOUT"),
      createMissionSubmissionUseCase.execute(created.id, submissionInput2, scoutId, "SCOUT"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error.message).toContain("Mission is not in progress or already submitted");
  });

  it("should rollback transaction completely if submission creation fails", async () => {
    const requesterId = "00000000-0000-0000-0000-000000000002";
    const scoutId = "00000000-0000-0000-0000-000000000003";

    // 1. Create, Publish, Claim, and Start Mission
    const created = await createMissionUseCase.execute(sampleInput, requesterId, "REQUESTER");
    await publishMissionUseCase.execute(created.id, requesterId, "REQUESTER");
    await claimMissionUseCase.execute(created.id, scoutId, "SCOUT");
    await startMissionUseCase.execute(created.id, scoutId, "SCOUT");

    // 2. Attempt to submit with failCreate = true to trigger failure after updateMany
    await expect(
      missionRepo.createSubmissionAtomically(
        created.id,
        scoutId,
        "Valid summary report",
        [],
        35.658034,
        139.701636,
        true,
      ),
    ).rejects.toThrow("Simulated database failure after updateMany");

    // 3. Verify that the mission status remains IN_PROGRESS (rolled back!)
    const missionAfterFailure = await missionRepo.findById(created.id);
    expect(missionAfterFailure?.status).toBe("IN_PROGRESS");

    // 4. Verify that no submission was created
    const submissionCount = await prisma.missionSubmission.count({
      where: { missionId: created.id },
    });
    expect(submissionCount).toBe(0);
  });
});
