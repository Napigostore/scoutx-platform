import type { Mission, MissionCategory, MissionUrgency, MissionStatus } from "@scoutx/types";
import { prisma } from "../lib/prisma";
import type {
  MissionRepository,
  RejectSubmissionInput,
  ResubmitSubmissionInput,
} from "./MissionRepository";

function toPrismaStatus(status: string): string {
  switch (status) {
    case "DRAFT":
      return "DRAFT";
    case "OPEN":
      return "OPEN";
    case "MATCHED":
      return "MATCHED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "SUBMITTED":
      return "SUBMITTED";
    case "VERIFIED":
      return "VERIFIED";
    case "COMPLETED":
      return "COMPLETED";
    case "EXPIRED":
      return "EXPIRED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

function toDomainStatus(status: string): string {
  switch (status) {
    case "DRAFT":
      return "DRAFT";
    case "OPEN":
      return "OPEN";
    case "MATCHED":
      return "MATCHED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "SUBMITTED":
      return "SUBMITTED";
    case "VERIFIED":
      return "VERIFIED";
    case "COMPLETED":
      return "COMPLETED";
    case "EXPIRED":
      return "EXPIRED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

export class PrismaMissionRepository implements MissionRepository {
  async create(mission: Mission): Promise<void> {
    if (mission.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: mission.locationId },
      });
      if (!location) {
        await prisma.location.create({
          data: {
            id: mission.locationId,
            name: "Default Location",
            city: "Ho Chi Minh City",
            country: "Vietnam",
            countryCode: "VN",
            latitude: mission.coordinates.latitude,
            longitude: mission.coordinates.longitude,
            timezone: "Asia/Ho_Chi_Minh",
          },
        });
      }
    }

    await prisma.mission.create({
      data: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        category: mission.category,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: toPrismaStatus(mission.status) as any,
        urgency: mission.urgency,
        budgetCents: mission.budget.amountCents,
        currency: mission.budget.currency,
        locationId: mission.locationId,
        latitude: mission.coordinates.latitude,
        longitude: mission.coordinates.longitude,
        radiusMeters: mission.radiusMeters,
        requesterId: mission.requesterId,
        assignedScoutId: mission.assignedScoutId,
        requiredTags: mission.requiredTags,
        expiresAt: mission.expiresAt,
        createdAt: mission.createdAt,
        updatedAt: mission.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Mission | null> {
    const row = await prisma.mission.findUnique({
      where: { id },
    });
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as MissionCategory,
      status: toDomainStatus(row.status) as MissionStatus,
      urgency: row.urgency as MissionUrgency,
      budget: {
        amountCents: row.budgetCents,
        currency: row.currency,
      },
      locationId: row.locationId,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      radiusMeters: row.radiusMeters,
      requesterId: row.requesterId,
      assignedScoutId: row.assignedScoutId,
      requiredTags: row.requiredTags,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByOwnerId(ownerId: string): Promise<readonly Mission[]> {
    const rows = await prisma.mission.findMany({
      where: { requesterId: ownerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as MissionCategory,
      status: toDomainStatus(row.status) as MissionStatus,
      urgency: row.urgency as MissionUrgency,
      budget: {
        amountCents: row.budgetCents,
        currency: row.currency,
      },
      locationId: row.locationId,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      radiusMeters: row.radiusMeters,
      requesterId: row.requesterId,
      assignedScoutId: row.assignedScoutId,
      requiredTags: row.requiredTags,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async update(mission: Mission): Promise<void> {
    await prisma.mission.update({
      where: { id: mission.id },
      data: {
        title: mission.title,
        description: mission.description,
        category: mission.category,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: toPrismaStatus(mission.status) as any,
        urgency: mission.urgency,
        budgetCents: mission.budget.amountCents,
        currency: mission.budget.currency,
        locationId: mission.locationId,
        latitude: mission.coordinates.latitude,
        longitude: mission.coordinates.longitude,
        radiusMeters: mission.radiusMeters,
        assignedScoutId: mission.assignedScoutId,
        requiredTags: mission.requiredTags,
        expiresAt: mission.expiresAt,
        updatedAt: mission.updatedAt,
      },
    });
  }

  async findAvailable(): Promise<readonly Mission[]> {
    const rows = await prisma.mission.findMany({
      where: {
        status: "OPEN",
        assignedScoutId: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as MissionCategory,
      status: toDomainStatus(row.status) as MissionStatus,
      urgency: row.urgency as MissionUrgency,
      budget: {
        amountCents: row.budgetCents,
        currency: row.currency,
      },
      locationId: row.locationId,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      radiusMeters: row.radiusMeters,
      requesterId: row.requesterId,
      assignedScoutId: row.assignedScoutId,
      requiredTags: row.requiredTags,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  private async getOrEnsureScoutProfile(scoutId: string) {
    let scoutProfile = await prisma.scoutProfile.findUnique({
      where: { userId: scoutId },
    });
    if (!scoutProfile) {
      const user = await prisma.user.findUnique({ where: { id: scoutId } });
      if (user && (user.role === "SCOUT" || user.role === "ADMIN")) {
        scoutProfile = await prisma.scoutProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            displayName: user.displayName || user.email.split("@")[0] || "Scout",
            bio: "Active Scout on FIWOKAN platform",
            homeLocationId: "00000000-0000-0000-0000-000000000001",
            stripeConnectStatus: "ACTIVE",
          },
        });
      }
    }
    if (!scoutProfile) {
      throw new Error("Scout profile not found");
    }
    return scoutProfile;
  }

  async claimAtomically(missionId: string, scoutId: string): Promise<boolean> {
    const scoutProfile = await this.getOrEnsureScoutProfile(scoutId);

    const result = await prisma.mission.updateMany({
      where: {
        id: missionId,
        status: "OPEN",
        assignedScoutId: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        status: "MATCHED",
        assignedScoutId: scoutProfile.id,
      },
    });
    return result.count > 0;
  }

  async findAssignedByScoutId(scoutId: string): Promise<readonly Mission[]> {
    const scoutProfile = await prisma.scoutProfile.findUnique({
      where: { userId: scoutId },
    });
    if (!scoutProfile) return [];

    const rows = await prisma.mission.findMany({
      where: {
        assignedScoutId: scoutProfile.id,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as MissionCategory,
      status: toDomainStatus(row.status) as MissionStatus,
      urgency: row.urgency as MissionUrgency,
      budget: {
        amountCents: row.budgetCents,
        currency: row.currency,
      },
      locationId: row.locationId,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      radiusMeters: row.radiusMeters,
      requesterId: row.requesterId,
      assignedScoutId: row.assignedScoutId,
      requiredTags: row.requiredTags,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async startAtomically(missionId: string, scoutId: string): Promise<boolean> {
    const scoutProfile = await this.getOrEnsureScoutProfile(scoutId);

    const result = await prisma.mission.updateMany({
      where: {
        id: missionId,
        status: "MATCHED",
        assignedScoutId: scoutProfile.id,
      },
      data: {
        status: "IN_PROGRESS",
      },
    });
    return result.count > 0;
  }

  async createSubmissionAtomically(
    missionId: string,
    scoutId: string,
    summary: string,
    mediaUrls: string[],
    latitude: number,
    longitude: number,
    failCreate = false,
  ): Promise<unknown> {
    const scoutProfile = await this.getOrEnsureScoutProfile(scoutId);

    return prisma.$transaction(async (tx) => {
      const result = await tx.mission.updateMany({
        where: {
          id: missionId,
          status: "IN_PROGRESS",
          assignedScoutId: scoutProfile.id,
        },
        data: {
          status: "SUBMITTED",
        },
      });

      if (result.count === 0) {
        throw new Error("Mission is not in progress or already submitted");
      }

      if (failCreate) {
        throw new Error("Simulated database failure after updateMany");
      }

      const submission = await tx.missionSubmission.create({
        data: {
          id: crypto.randomUUID(),
          missionId,
          scoutId: scoutProfile.id,
          userId: scoutProfile.userId,
          summary,
          mediaUrls,
          observedAt: new Date(),
          latitude,
          longitude,
          verified: false,
        },
      });

      return submission;
    });
  }

  // --- SX-021A: Review methods ---

  async approveSubmissionAtomically(missionId: string, requesterId: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const missionResult = await tx.mission.updateMany({
        where: {
          id: missionId,
          requesterId,
          status: "SUBMITTED",
        },
        data: {
          status: "VERIFIED",
        },
      });

      if (missionResult.count === 0) {
        return false;
      }

      const submissionResult = await tx.missionSubmission.updateMany({
        where: { missionId },
        data: {
          verified: true,
          reviewedAt: now,
          rejectionReason: null,
        },
      });

      if (submissionResult.count === 0) {
        throw new Error("Submission not found for mission");
      }

      const missionRecord = await tx.mission.findUnique({
        where: { id: missionId },
        select: { budgetCents: true, currency: true, assignedScoutId: true },
      });

      if (!missionRecord || !missionRecord.assignedScoutId) {
        throw new Error("Mission or assigned scout not found for reward creation");
      }

      const scoutProfile = await tx.scoutProfile.findUnique({
        where: { id: missionRecord.assignedScoutId },
        select: { userId: true },
      });

      if (!scoutProfile) {
        throw new Error("Scout profile not found for reward creation");
      }

      await tx.coinTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId: scoutProfile.userId,
          missionId,
          amountCents: missionRecord.budgetCents,
          currency: missionRecord.currency.trim() || "COIN",
          reason: `Mission Completion Reward for ${missionId}`,
          description: `Payout reward for completed mission ${missionId}`,
          eventType: "Reward",
        },
      });

      return true;
    });
  }

  async rejectSubmissionAtomically(
    missionId: string,
    requesterId: string,
    input: RejectSubmissionInput,
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const missionResult = await tx.mission.updateMany({
        where: {
          id: missionId,
          requesterId,
          status: "SUBMITTED",
        },
        data: {
          status: "IN_PROGRESS",
        },
      });

      if (missionResult.count === 0) {
        return false;
      }

      const submissionResult = await tx.missionSubmission.updateMany({
        where: { missionId },
        data: {
          verified: false,
          reviewedAt: now,
          rejectionReason: input.rejectionReason,
        },
      });

      if (submissionResult.count === 0) {
        throw new Error("Submission not found for mission");
      }

      return true;
    });
  }

  async resubmitSubmissionAtomically(
    missionId: string,
    scoutId: string,
    input: ResubmitSubmissionInput,
  ): Promise<boolean> {
    const scoutProfile = await prisma.scoutProfile.findUnique({
      where: { userId: scoutId },
    });
    if (!scoutProfile) {
      throw new Error("Scout profile not found");
    }

    return prisma.$transaction(async (tx) => {
      const missionResult = await tx.mission.updateMany({
        where: {
          id: missionId,
          status: "IN_PROGRESS",
          assignedScoutId: scoutProfile.id,
        },
        data: {
          status: "SUBMITTED",
        },
      });

      if (missionResult.count === 0) {
        return false;
      }

      const submissionResult = await tx.missionSubmission.updateMany({
        where: {
          missionId,
          scoutId: scoutProfile.id,
        },
        data: {
          summary: input.summary,
          mediaUrls: input.mediaUrls,
          latitude: input.latitude,
          longitude: input.longitude,
          observedAt: new Date(input.observedAt),
          verified: false,
          reviewedAt: null,
          rejectionReason: null,
        },
      });

      if (submissionResult.count === 0) {
        throw new Error("Submission not found for this scout on this mission");
      }

      return true;
    });
  }
}
