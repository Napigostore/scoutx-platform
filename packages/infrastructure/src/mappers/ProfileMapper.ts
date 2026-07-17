import type { ScoutProfile } from "@scoutx/types";

export interface PrismaScoutProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE";
  reliabilityScore: number;
  completedMissions: number;
  categories: unknown[];
  tags: string[];
  homeLocationId: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  maxRadiusMeters: number;
  languages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ProfileMapper {
  static toDomain(prismaProfile: PrismaScoutProfile): ScoutProfile {
    return {
      id: prismaProfile.id,
      userId: prismaProfile.userId,
      displayName: prismaProfile.displayName,
      bio: prismaProfile.bio,
      availability: prismaProfile.availability,
      reliabilityScore: prismaProfile.reliabilityScore,
      completedMissions: prismaProfile.completedMissions,
      categories: prismaProfile.categories as unknown as Array<
        | "STREET_CONDITIONS"
        | "VENUE_STATUS"
        | "LOCAL_EVENT"
        | "PRODUCT_AVAILABILITY"
        | "CROWD_DENSITY"
        | "WEATHER_ON_SITE"
        | "PHOTO_VERIFICATION"
        | "GENERAL_OBSERVATION"
      >,
      tags: prismaProfile.tags,
      homeLocationId: prismaProfile.homeLocationId,
      currentCoordinates:
        prismaProfile.currentLatitude !== null && prismaProfile.currentLongitude !== null
          ? { latitude: prismaProfile.currentLatitude, longitude: prismaProfile.currentLongitude }
          : null,
      maxRadiusMeters: prismaProfile.maxRadiusMeters,
      languages: prismaProfile.languages || [],
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt,
    };
  }

  static toPrisma(domainProfile: ScoutProfile, homeLocationId: string): PrismaScoutProfile {
    return {
      id: domainProfile.id,
      userId: domainProfile.userId,
      displayName: domainProfile.displayName,
      bio: domainProfile.bio,
      availability: domainProfile.availability,
      reliabilityScore: domainProfile.reliabilityScore,
      completedMissions: domainProfile.completedMissions,
      categories: domainProfile.categories as unknown as string[],
      tags: domainProfile.tags,
      homeLocationId,
      currentLatitude: domainProfile.currentCoordinates?.latitude ?? null,
      currentLongitude: domainProfile.currentCoordinates?.longitude ?? null,
      maxRadiusMeters: domainProfile.maxRadiusMeters,
      languages: domainProfile.languages || [],
      createdAt: domainProfile.createdAt,
      updatedAt: domainProfile.updatedAt,
    };
  }
}
