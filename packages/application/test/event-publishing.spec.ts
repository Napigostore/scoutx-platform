import { describe, expect, it, vi } from "vitest";
import {
  ApproveMissionSubmissionUseCase,
  RejectMissionSubmissionUseCase,
  ResubmitMissionSubmissionUseCase,
} from "../src/index.js";
import type { MissionRepository } from "@scoutx/infrastructure";
import type { EventBus } from "@scoutx/events";
import type { Mission } from "@scoutx/types";

function mockMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission-1",
    requesterId: "requester-1",
    assignedScoutId: "scout-1",
    title: "Test Mission",
    description: "A test mission",
    category: "STREET_CONDITIONS",
    urgency: "NORMAL",
    budget: { amountCents: 5000, currency: "USD" },
    locationId: "loc-1",
    coordinates: { latitude: 35.0, longitude: 139.0 },
    radiusMeters: 1000,
    requiredTags: [],
    status: "SUBMITTED",
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    ...overrides,
  };
}

function mockEventBus(): EventBus & { published: any[] } {
  const published: any[] = [];
  return {
    published,
    async publish(event: any) {
      published.push(event);
    },
  };
}

describe("Event Publishing", () => {
  describe("ApproveMissionSubmissionUseCase", () => {
    it("should publish mission.approved event on successful approval", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(mockMission()),
        approveSubmissionAtomically: vi.fn().mockResolvedValue(true),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new ApproveMissionSubmissionUseCase(repo, eventBus);
      await useCase.execute("mission-1", "requester-1", "REQUESTER");

      expect(eventBus.published).toHaveLength(1);
      expect(eventBus.published[0]).toMatchObject({
        type: "mission.approved",
        missionId: "mission-1",
        requesterId: "requester-1",
        scoutId: "scout-1",
      });
      expect(eventBus.published[0].timestamp).toBeDefined();
      expect(typeof eventBus.published[0].timestamp).toBe("string");
    });

    it("should NOT publish mission.approved when approval fails (concurrent conflict)", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(mockMission()),
        approveSubmissionAtomically: vi.fn().mockResolvedValue(false),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new ApproveMissionSubmissionUseCase(repo, eventBus);
      await expect(
        useCase.execute("mission-1", "requester-1", "REQUESTER"),
      ).rejects.toThrow();

      expect(eventBus.published).toHaveLength(0);
    });

    it("should NOT publish mission.approved when mission is not found", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(null),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new ApproveMissionSubmissionUseCase(repo, eventBus);
      await expect(
        useCase.execute("mission-1", "requester-1", "REQUESTER"),
      ).rejects.toThrow();

      expect(eventBus.published).toHaveLength(0);
    });
  });

  describe("RejectMissionSubmissionUseCase", () => {
    it("should publish mission.rejected event on successful rejection", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(mockMission()),
        rejectSubmissionAtomically: vi.fn().mockResolvedValue(true),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new RejectMissionSubmissionUseCase(repo, eventBus);
      await useCase.execute("mission-1", "requester-1", "REQUESTER", {
        rejectionReason: "Insufficient evidence quality",
      });

      expect(eventBus.published).toHaveLength(1);
      expect(eventBus.published[0]).toMatchObject({
        type: "mission.rejected",
        missionId: "mission-1",
        requesterId: "requester-1",
        scoutId: "scout-1",
        rejectionReason: "Insufficient evidence quality",
      });
      expect(eventBus.published[0].timestamp).toBeDefined();
    });

    it("should NOT publish mission.rejected when rejection fails (concurrent conflict)", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(mockMission()),
        rejectSubmissionAtomically: vi.fn().mockResolvedValue(false),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new RejectMissionSubmissionUseCase(repo, eventBus);
      await expect(
        useCase.execute("mission-1", "requester-1", "REQUESTER", {
          rejectionReason: "Insufficient evidence quality",
        }),
      ).rejects.toThrow();

      expect(eventBus.published).toHaveLength(0);
    });
  });

  describe("ResubmitMissionSubmissionUseCase", () => {
    it("should publish submission.resubmitted event on successful resubmission", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(
          mockMission({ status: "IN_PROGRESS" }),
        ),
        resubmitSubmissionAtomically: vi.fn().mockResolvedValue(true),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new ResubmitMissionSubmissionUseCase(repo, eventBus);
      await useCase.execute("mission-1", "scout-1", "SCOUT", {
        summary: "Resubmitted evidence with better quality here.",
        mediaUrls: ["https://example.com/photo.jpg"],
        latitude: 35.0,
        longitude: 139.0,
        observedAt: new Date().toISOString(),
      });

      expect(eventBus.published).toHaveLength(1);
      expect(eventBus.published[0]).toMatchObject({
        type: "submission.resubmitted",
        missionId: "mission-1",
        scoutId: "scout-1",
        summary: "Resubmitted evidence with better quality here.",
      });
      expect(eventBus.published[0].timestamp).toBeDefined();
    });

    it("should NOT publish submission.resubmitted when resubmission fails (concurrent conflict)", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(
          mockMission({ status: "IN_PROGRESS" }),
        ),
        resubmitSubmissionAtomically: vi.fn().mockResolvedValue(false),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new ResubmitMissionSubmissionUseCase(repo, eventBus);
      await expect(
        useCase.execute("mission-1", "scout-1", "SCOUT", {
          summary: "Resubmitted evidence with better quality here.",
          mediaUrls: ["https://example.com/photo.jpg"],
          latitude: 35.0,
          longitude: 139.0,
          observedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow();

      expect(eventBus.published).toHaveLength(0);
    });

    it("should NOT publish submission.resubmitted when mission is not found", async () => {
      const repo: MissionRepository = {
        findById: vi.fn().mockResolvedValue(null),
      } as any;
      const eventBus = mockEventBus();

      const useCase = new ResubmitMissionSubmissionUseCase(repo, eventBus);
      await expect(
        useCase.execute("mission-1", "scout-1", "SCOUT", {
          summary: "Resubmitted evidence with better quality here.",
          mediaUrls: ["https://example.com/photo.jpg"],
          latitude: 35.0,
          longitude: 139.0,
          observedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow();

      expect(eventBus.published).toHaveLength(0);
    });
  });
});
