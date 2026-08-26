import { prisma } from "../lib/prisma";
import type { ScoutProfile, ScoutAvailability, MissionCategory } from "@scoutx/types";
import type { ScoutRepository } from "./ScoutRepository";

/**
 * Cast helper for Prisma enum array fields.
 * Prisma generates TypeScript enums for MissionCategory[], but our domain
 * types use plain string enums. The cast is safe because the values match.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castEnumArray<T>(arr: any): T {
  return arr as unknown as T;
}

function mapToDomain(row: {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  availability: string;
  reliabilityScore: number;
  completedMissions: number;
  categories: string[];
  tags: string[];
  homeLocationId: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  maxRadiusMeters: number;
  languages: string[];
  createdAt: Date;
  updatedAt: Date;
}): ScoutProfile {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    bio: row.bio,
    availability: row.availability as ScoutAvailability,
    reliabilityScore: row.reliabilityScore,
    completedMissions: row.completedMissions,
    categories: row.categories as MissionCategory[],
    tags: row.tags,
    homeLocationId: row.homeLocationId,
    currentCoordinates:
      row.currentLatitude != null && row.currentLongitude != null
        ? { latitude: row.currentLatitude, longitude: row.currentLongitude }
        : null,
    maxRadiusMeters: row.maxRadiusMeters,
    languages: row.languages,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaScoutRepository implements ScoutRepository {
  async findById(id: string): Promise<ScoutProfile | null> {
    const row = await prisma.scoutProfile.findUnique({
      where: { id },
    });
    if (!row) return null;
    return mapToDomain(row);
  }

  async findByUserId(userId: string): Promise<ScoutProfile | null> {
    const row = await prisma.scoutProfile.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return mapToDomain(row);
  }

  async findAvailable(params: {
    categories?: string[];
    maxRadiusMeters?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<readonly ScoutProfile[]> {
    const where: Record<string, unknown> = {
      availability: "AVAILABLE",
    };

    if (params.categories && params.categories.length > 0) {
      where.categories = { hasSome: castEnumArray(params.categories) };
    }

    if (params.maxRadiusMeters) {
      where.maxRadiusMeters = { gte: params.maxRadiusMeters };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma.scoutProfile as any).findMany({
      where,
      orderBy: { reliabilityScore: "desc" },
      take: 50,
    });

    return rows.map(mapToDomain);
  }

  async update(profile: ScoutProfile): Promise<void> {
    await prisma.scoutProfile.update({
      where: { id: profile.id },
      data: {
        displayName: profile.displayName,
        bio: profile.bio,
        availability: profile.availability as "AVAILABLE" | "BUSY" | "OFFLINE",
        reliabilityScore: profile.reliabilityScore,
        completedMissions: profile.completedMissions,
        categories: castEnumArray(profile.categories),
        tags: profile.tags,
        homeLocationId: profile.homeLocationId,
        currentLatitude: profile.currentCoordinates?.latitude ?? null,
        currentLongitude: profile.currentCoordinates?.longitude ?? null,
        maxRadiusMeters: profile.maxRadiusMeters,
        languages: profile.languages,
      },
    });
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<void> {
    await prisma.scoutProfile.update({
      where: { id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
    });
  }

  async incrementCompletedMissions(id: string): Promise<number> {
    const result = await prisma.scoutProfile.update({
      where: { id },
      data: {
        completedMissions: { increment: 1 },
      },
    });
    return result.completedMissions;
  }

  async count(): Promise<number> {
    return prisma.scoutProfile.count();
  }
}
