import { PrismaClient, MissionStatus as PrismaStatus } from "@prisma/client";
import type { Mission, MissionCategory, MissionUrgency, MissionStatus } from "@scoutx/types";
import type { MissionRepository } from "./MissionRepository.js";

const globalForPrisma = globalThis as typeof globalThis & {
  __scoutxInfraPrisma?: PrismaClient;
};

const prisma =
  globalForPrisma.__scoutxInfraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__scoutxInfraPrisma = prisma;
}

function toPrismaStatus(status: string): PrismaStatus {
  switch (status) {
    case "DRAFT":
      return PrismaStatus.DRAFT;
    case "OPEN":
      return PrismaStatus.OPEN;
    case "MATCHED":
      return PrismaStatus.MATCHED;
    case "IN_PROGRESS":
      return PrismaStatus.IN_PROGRESS;
    case "SUBMITTED":
      return PrismaStatus.SUBMITTED;
    case "VERIFIED":
      return PrismaStatus.VERIFIED;
    case "COMPLETED":
      return PrismaStatus.COMPLETED;
    case "EXPIRED":
      return PrismaStatus.EXPIRED;
    case "CANCELLED":
      return PrismaStatus.CANCELLED;
    default:
      return PrismaStatus.DRAFT;
  }
}

function toDomainStatus(status: PrismaStatus): string {
  switch (status) {
    case PrismaStatus.DRAFT:
      return "DRAFT";
    case PrismaStatus.OPEN:
      return "OPEN";
    case PrismaStatus.MATCHED:
      return "MATCHED";
    case PrismaStatus.IN_PROGRESS:
      return "IN_PROGRESS";
    case PrismaStatus.SUBMITTED:
      return "SUBMITTED";
    case PrismaStatus.VERIFIED:
      return "VERIFIED";
    case PrismaStatus.COMPLETED:
      return "COMPLETED";
    case PrismaStatus.EXPIRED:
      return "EXPIRED";
    case PrismaStatus.CANCELLED:
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

export class PrismaMissionRepository implements MissionRepository {
  async create(mission: Mission): Promise<void> {
    await prisma.mission.create({
      data: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        category: mission.category,
        status: toPrismaStatus(mission.status),
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
        status: toPrismaStatus(mission.status),
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
        status: PrismaStatus.OPEN,
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

  async claimAtomically(missionId: string, scoutId: string): Promise<boolean> {
    const scoutProfile = await prisma.scoutProfile.findUnique({
      where: { userId: scoutId },
    });
    if (!scoutProfile) {
      throw new Error("Scout profile not found");
    }

    const result = await prisma.mission.updateMany({
      where: {
        id: missionId,
        status: PrismaStatus.OPEN,
        assignedScoutId: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        status: PrismaStatus.MATCHED,
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
    const scoutProfile = await prisma.scoutProfile.findUnique({
      where: { userId: scoutId },
    });
    if (!scoutProfile) {
      throw new Error("Scout profile not found");
    }

    const result = await prisma.mission.updateMany({
      where: {
        id: missionId,
        status: PrismaStatus.MATCHED,
        assignedScoutId: scoutProfile.id,
      },
      data: {
        status: PrismaStatus.IN_PROGRESS,
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
    const scoutProfile = await prisma.scoutProfile.findUnique({
      where: { userId: scoutId },
    });
    if (!scoutProfile) {
      throw new Error("Scout profile not found");
    }

    return prisma.$transaction(async (tx) => {
      const result = await tx.mission.updateMany({
        where: {
          id: missionId,
          status: PrismaStatus.IN_PROGRESS,
          assignedScoutId: scoutProfile.id,
        },
        data: {
          status: PrismaStatus.SUBMITTED,
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
}
