import { prisma } from "../lib/prisma";

export interface SeedOptions {
  scoutCount?: number;
  missionCount?: number;
}

export class ProductionSeedGenerator {
  private static readonly CITIES = [
    { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
    { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
    { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797 },
    { city: "New York", state: "NY", lat: 40.7128, lng: -74.006 },
    { city: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194 },
  ];

  private static readonly VEHICLES = [
    "2022 Tesla Model 3 Long Range",
    "2023 Tesla Model Y Performance",
    "2021 Ford F-150 Lightning",
    "2020 Porsche 911 Carrera S",
    "2022 Chevrolet Corvette Stingray",
    "2023 BMW M4 Competition",
  ];

  public static async seedProductionData(
    opts?: SeedOptions,
  ): Promise<{ scoutsCreated: number; missionsCreated: number }> {
    const scoutCount = opts?.scoutCount ?? 20;
    const missionCount = opts?.missionCount ?? 50;

    let createdScouts = 0;
    let createdMissions = 0;

    // 1. Seed Scouts
    for (let i = 1; i <= scoutCount; i++) {
      const cityInfo = this.CITIES[i % this.CITIES.length]!;
      const userId = `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a${i < 10 ? `0${i}` : i}`;

      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: userId,
            email: `scout.${i}@scoutx-beta.com`,
            displayName: `Scout ${cityInfo.city} #${i}`,
            role: "SCOUT",
            passwordHash: "seeded_hash_beta_123",
          },
        });
        createdScouts++;
      }
    }

    // 2. Seed Vehicle Verification Missions
    for (let j = 1; j <= missionCount; j++) {
      const cityInfo = this.CITIES[j % this.CITIES.length]!;
      const vehicle = this.VEHICLES[j % this.VEHICLES.length]!;
      const missionId = `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b${j < 10 ? `0${j}` : j}`;

      const existingMission = await prisma.mission.findUnique({ where: { id: missionId } });
      if (!existingMission) {
        // Ensure default location exists or use coordinates directly
        const locationId = `c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01`;
        const existingLoc = await prisma.location.findUnique({ where: { id: locationId } });
        if (!existingLoc) {
          await prisma.location.create({
            data: {
              id: locationId,
              name: `${cityInfo.city} Downtown`,
              city: cityInfo.city,
              country: "United States",
              countryCode: "US",
              latitude: cityInfo.lat,
              longitude: cityInfo.lng,
              timezone: "America/Chicago",
            },
          });
        }

        const requesterId = `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00`;
        const existingReq = await prisma.user.findUnique({ where: { id: requesterId } });
        if (!existingReq) {
          await prisma.user.create({
            data: {
              id: requesterId,
              email: `requester.admin@scoutx-beta.com`,
              displayName: "ScoutX Admin Requester",
              role: "REQUESTER",
              passwordHash: "seeded_hash_beta_123",
            },
          });
        }

        await prisma.mission.create({
          data: {
            id: missionId,
            title: `Remote Vehicle Inspection: ${vehicle}`,
            description: `Verify VIN, odometer, paint condition, and seller identity in ${cityInfo.city}, ${cityInfo.state}. Require 25+ HD photos.`,
            category: "PHOTO_VERIFICATION",
            status: j % 2 === 0 ? "OPEN" : "COMPLETED",
            requesterId,
            locationId,
            latitude: cityInfo.lat + (j % 10) * 0.01,
            longitude: cityInfo.lng + (j % 10) * 0.01,
            budgetCents: 7500, // $75
            currency: "USD",
            expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          },
        });
        createdMissions++;
      }
    }

    return { scoutsCreated: createdScouts, missionsCreated: createdMissions };
  }
}
