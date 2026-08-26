import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findGlobalCityByName } from "@/lib/global-cities";

export interface ScoutMapLocationCluster {
  cityId: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  availableScoutCount: number;
}

export async function GET() {
  try {
    // Query active available user profiles from real database
    const availableProfiles = await prisma.userProfile.findMany({
      where: {
        availableForMissions: true,
      },
      select: {
        userId: true,
        livingCity: true,
        livingCountry: true,
        livingCountryCode: true,
        latitude: true,
        longitude: true,
      },
    });

    // Also include ScoutProfiles with availability = AVAILABLE who don't have userProfile record yet
    const existingUserIdsWithProfile = new Set(availableProfiles.map((p) => p.userId));

    const scoutProfiles = await prisma.scoutProfile.findMany({
      where: {
        availability: "AVAILABLE",
        userId: {
          notIn: Array.from(existingUserIdsWithProfile),
        },
      },
      include: {
        homeLocation: true,
      },
    });

    // Aggregate counts by City key
    const cityClusterMap = new Map<string, ScoutMapLocationCluster>();

    // 1. Process UserProfile records
    for (const p of availableProfiles) {
      const cityName = p.livingCity || "Ho Chi Minh City";
      const globalCity = findGlobalCityByName(cityName);

      const cityKey = `${globalCity.city.toLowerCase()}-${globalCity.countryCode.toLowerCase()}`;

      if (cityClusterMap.has(cityKey)) {
        const existing = cityClusterMap.get(cityKey)!;
        existing.availableScoutCount += 1;
      } else {
        cityClusterMap.set(cityKey, {
          cityId: globalCity.id,
          city: globalCity.city,
          country: p.livingCountry || globalCity.country,
          countryCode: p.livingCountryCode || globalCity.countryCode,
          latitude: p.latitude || globalCity.latitude,
          longitude: p.longitude || globalCity.longitude,
          availableScoutCount: 1,
        });
      }
    }

    // 2. Process ScoutProfile fallback records
    for (const sp of scoutProfiles) {
      const cityName = sp.homeLocation?.city || sp.homeLocation?.name || "Ho Chi Minh City";
      const globalCity = findGlobalCityByName(cityName);
      const cityKey = `${globalCity.city.toLowerCase()}-${globalCity.countryCode.toLowerCase()}`;

      if (cityClusterMap.has(cityKey)) {
        const existing = cityClusterMap.get(cityKey)!;
        existing.availableScoutCount += 1;
      } else {
        cityClusterMap.set(cityKey, {
          cityId: globalCity.id,
          city: globalCity.city,
          country: sp.homeLocation?.country || globalCity.country,
          countryCode: sp.homeLocation?.countryCode || globalCity.countryCode,
          latitude: sp.homeLocation?.latitude || globalCity.latitude,
          longitude: sp.homeLocation?.longitude || globalCity.longitude,
          availableScoutCount: 1,
        });
      }
    }

    const locations = Array.from(cityClusterMap.values());

    return NextResponse.json(
      {
        success: true,
        locations,
        totalAvailableScouts: locations.reduce((sum, l) => sum + l.availableScoutCount, 0),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=5, s-maxage=5",
        },
      },
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[SCOUTS_MAP_API_ERROR]", err?.message);
    return NextResponse.json({ error: "Failed to fetch global scout map locations" }, { status: 500 });
  }
}
