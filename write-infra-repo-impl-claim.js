const fs = require("fs");
const content = `import { PrismaClient, MissionStatus as PrismaStatus } from "@prisma/client";
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
    case "DRAFT": return PrismaStatus.DRAFT;
    case "PUBLISHED": return PrismaStatus.OPEN;
    case "ACCEPTED": return PrismaStatus.MATCHED;
    case "IN_PROGRESS": return PrismaStatus.IN_PROGRESS;
    case "SUBMITTED": return PrismaStatus.SUBMITTED;
    case "VERIFYING": return PrismaStatus.VERIFIED;
    case "COMPLETED": return PrismaStatus.COMPLETED;
    case "FAILED": return PrismaStatus.EXPIRED;
    case "CANCELLED": return PrismaStatus.CANCELLED;
    default: return PrismaStatus.DRAFT;
  }
}

function toDomainStatus(status: PrismaStatus): string {
  switch (status) {
    case PrismaStatus.DRAFT: return "DRAFT";
    case PrismaStatus.OPEN: return "PUBLISHED";
    case PrismaStatus.MATCHED: return "ACCEPTED";
    case PrismaStatus.IN_PROGRESS: return "IN_PROGRESS";
    case PrismaStatus.SUBMITTED: return "SUBMITTED";
    case PrismaStatus.VERIFIED: return "VERIFYING";
    case PrismaStatus.COMPLETED: return "COMPLETED";
    case PrismaStatus.EXPIRED: return "FAILED";
    case PrismaStatus.CANCELLED: return "CANCELLED";
    default: return "DRAFT";
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
      },
      data: {
        status: PrismaStatus.MATCHED,
        assignedScoutId: scoutProfile.id,
      },
    });
    return result.count > 0;
  }
}
`;
fs.writeFileSync(
  "packages/infrastructure/src/repositories/PrismaMissionRepository.ts",
  content,
  "utf8",
);
console.log("Successfully wrote PrismaMissionRepository.ts");
