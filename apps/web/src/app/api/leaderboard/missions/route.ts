import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

interface MissionRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  budgetCents: number;
  currency: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  requiredTags: string[];
  expiresAt: Date;
  createdAt: Date;
  assignedScoutId?: string | null;
  location?: { city?: string; country?: string } | null;
  requester?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    reliabilityScore?: number;
  } | null;
  evidence?: { id: string; scoutId?: string | null; createdAt: Date }[];
  submission?: { id: string; scoutId?: string | null } | null;
  timelineEntries?: { id: string; createdAt: Date }[];
}

const MOCK_20_MISSIONS = [
  {
    id: "m-01",
    title: "Retail Storefront Construction Audit",
    category: "VENUE_STATUS",
    urgency: "CRITICAL",
    budgetCents: 1850000,
    city: "Ho Chi Minh City",
    country: "Vietnam",
    uniqueScoutsCount: 14,
    estimatedTimeMins: 25,
    difficulty: "Easy",
    evidenceRequiredCount: 3,
    requesterName: "VinGroup Retail Audit",
    requesterReputation: 4.95,
    hoursLeft: 4,
  },
  {
    id: "m-02",
    title: "Intersection Traffic & Congestion Survey",
    category: "STREET_CONDITIONS",
    urgency: "HIGH",
    budgetCents: 1450000,
    city: "Hanoi",
    country: "Vietnam",
    uniqueScoutsCount: 11,
    estimatedTimeMins: 35,
    difficulty: "Medium",
    evidenceRequiredCount: 4,
    requesterName: "Urban Mobility Analytics",
    requesterReputation: 4.9,
    hoursLeft: 8,
  },
  {
    id: "m-03",
    title: "On-Site EV Charging Station Availability",
    category: "PRODUCT_AVAILABILITY",
    urgency: "HIGH",
    budgetCents: 1200000,
    city: "Da Nang",
    country: "Vietnam",
    uniqueScoutsCount: 9,
    estimatedTimeMins: 20,
    difficulty: "Easy",
    evidenceRequiredCount: 2,
    requesterName: "GreenCharge Asia",
    requesterReputation: 4.88,
    hoursLeft: 12,
  },
  {
    id: "m-04",
    title: "Supermarket Shelf Stock & Price Tag Check",
    category: "PRODUCT_AVAILABILITY",
    urgency: "NORMAL",
    budgetCents: 950000,
    city: "Can Tho",
    country: "Vietnam",
    uniqueScoutsCount: 8,
    estimatedTimeMins: 30,
    difficulty: "Medium",
    evidenceRequiredCount: 3,
    requesterName: "FMCG Intelligence Co",
    requesterReputation: 4.85,
    hoursLeft: 18,
  },
  {
    id: "m-05",
    title: "Coastal Weather & Water Level Inspection",
    category: "WEATHER_ON_SITE",
    urgency: "CRITICAL",
    budgetCents: 2200000,
    city: "Hai Phong",
    country: "Vietnam",
    uniqueScoutsCount: 15,
    estimatedTimeMins: 45,
    difficulty: "Advanced",
    evidenceRequiredCount: 5,
    requesterName: "Maritime Risk Institute",
    requesterReputation: 4.92,
    hoursLeft: 3,
  },
  {
    id: "m-06",
    title: "Night Market Crowd Density & Event Check",
    category: "CROWD_DENSITY",
    urgency: "NORMAL",
    budgetCents: 850000,
    city: "Ho Chi Minh City",
    country: "Vietnam",
    uniqueScoutsCount: 7,
    estimatedTimeMins: 20,
    difficulty: "Easy",
    evidenceRequiredCount: 2,
    requesterName: "City Pulse Media",
    requesterReputation: 4.78,
    hoursLeft: 24,
  },
  {
    id: "m-07",
    title: "Historic Landmark Facade Photo Verification",
    category: "PHOTO_VERIFICATION",
    urgency: "LOW",
    budgetCents: 650000,
    city: "Hanoi",
    country: "Vietnam",
    uniqueScoutsCount: 6,
    estimatedTimeMins: 15,
    difficulty: "Easy",
    evidenceRequiredCount: 2,
    requesterName: "Heritage Preservation Fund",
    requesterReputation: 4.82,
    hoursLeft: 36,
  },
  {
    id: "m-08",
    title: "Logistics Hub Cargo Loading Observation",
    category: "GENERAL_OBSERVATION",
    urgency: "HIGH",
    budgetCents: 1600000,
    city: "Da Nang",
    country: "Vietnam",
    uniqueScoutsCount: 10,
    estimatedTimeMins: 40,
    difficulty: "Medium",
    evidenceRequiredCount: 4,
    requesterName: "TransAsia Supply Chain",
    requesterReputation: 4.87,
    hoursLeft: 9,
  },
  {
    id: "m-09",
    title: "Pop-Up Store Foot Traffic Count",
    category: "CROWD_DENSITY",
    urgency: "NORMAL",
    budgetCents: 780000,
    city: "Ho Chi Minh City",
    country: "Vietnam",
    uniqueScoutsCount: 5,
    estimatedTimeMins: 25,
    difficulty: "Medium",
    evidenceRequiredCount: 3,
    requesterName: "BrandMetrics SEA",
    requesterReputation: 4.75,
    hoursLeft: 14,
  },
  {
    id: "m-10",
    title: "Bridge Clearance & Waterway Obstruction Inspection",
    category: "STREET_CONDITIONS",
    urgency: "HIGH",
    budgetCents: 1750000,
    city: "Can Tho",
    country: "Vietnam",
    uniqueScoutsCount: 8,
    estimatedTimeMins: 35,
    difficulty: "Advanced",
    evidenceRequiredCount: 4,
    requesterName: "Mekong Hydro Engineering",
    requesterReputation: 4.91,
    hoursLeft: 7,
  },
  {
    id: "m-11",
    title: "Pharmacy Chain Cold Storage Display Verification",
    category: "PRODUCT_AVAILABILITY",
    urgency: "NORMAL",
    budgetCents: 900000,
    city: "Hai Phong",
    country: "Vietnam",
    uniqueScoutsCount: 4,
    estimatedTimeMins: 20,
    difficulty: "Easy",
    evidenceRequiredCount: 2,
    requesterName: "PharmaCare Regional",
    requesterReputation: 4.8,
    hoursLeft: 20,
  },
  {
    id: "m-12",
    title: "Construction Noise & Dust Pollution Assessment",
    category: "GENERAL_OBSERVATION",
    urgency: "CRITICAL",
    budgetCents: 1950000,
    city: "Hanoi",
    country: "Vietnam",
    uniqueScoutsCount: 12,
    estimatedTimeMins: 45,
    difficulty: "Advanced",
    evidenceRequiredCount: 5,
    requesterName: "EcoSurv Compliance",
    requesterReputation: 4.94,
    hoursLeft: 5,
  },
  {
    id: "m-13",
    title: "Billboard Display & Lighting Audit",
    category: "PHOTO_VERIFICATION",
    urgency: "LOW",
    budgetCents: 550000,
    city: "Ho Chi Minh City",
    country: "Vietnam",
    uniqueScoutsCount: 3,
    estimatedTimeMins: 15,
    difficulty: "Easy",
    evidenceRequiredCount: 2,
    requesterName: "Out-of-Home Media Group",
    requesterReputation: 4.72,
    hoursLeft: 48,
  },
  {
    id: "m-14",
    title: "Industrial Zone Warehouse Entrance Gate Log",
    category: "GENERAL_OBSERVATION",
    urgency: "NORMAL",
    budgetCents: 1100000,
    city: "Hai Phong",
    country: "Vietnam",
    uniqueScoutsCount: 6,
    estimatedTimeMins: 30,
    difficulty: "Medium",
    evidenceRequiredCount: 3,
    requesterName: "Global Freight Watch",
    requesterReputation: 4.86,
    hoursLeft: 16,
  },
  {
    id: "m-15",
    title: "Food Street Hygiene & Sanitation Sampling",
    category: "VENUE_STATUS",
    urgency: "HIGH",
    budgetCents: 1300000,
    city: "Da Nang",
    country: "Vietnam",
    uniqueScoutsCount: 9,
    estimatedTimeMins: 25,
    difficulty: "Medium",
    evidenceRequiredCount: 3,
    requesterName: "Culinary Safety Board",
    requesterReputation: 4.89,
    hoursLeft: 10,
  },
  {
    id: "m-16",
    title: "Solar Panel Farm Shading & Dust Inspection",
    category: "WEATHER_ON_SITE",
    urgency: "NORMAL",
    budgetCents: 1500000,
    city: "Can Tho",
    country: "Vietnam",
    uniqueScoutsCount: 5,
    estimatedTimeMins: 40,
    difficulty: "Advanced",
    evidenceRequiredCount: 4,
    requesterName: "SunPower Field Ops",
    requesterReputation: 4.83,
    hoursLeft: 22,
  },
  {
    id: "m-17",
    title: "Convention Center Event Entrance Registration Check",
    category: "LOCAL_EVENT",
    urgency: "CRITICAL",
    budgetCents: 2100000,
    city: "Ho Chi Minh City",
    country: "Vietnam",
    uniqueScoutsCount: 13,
    estimatedTimeMins: 30,
    difficulty: "Medium",
    evidenceRequiredCount: 4,
    requesterName: "ExpoGlobal Asia",
    requesterReputation: 4.96,
    hoursLeft: 2,
  },
  {
    id: "m-18",
    title: "Public Park Playground Equipment Safety Audit",
    category: "STREET_CONDITIONS",
    urgency: "LOW",
    budgetCents: 600000,
    city: "Hanoi",
    country: "Vietnam",
    uniqueScoutsCount: 2,
    estimatedTimeMins: 20,
    difficulty: "Easy",
    evidenceRequiredCount: 2,
    requesterName: "Civic Safety NGO",
    requesterReputation: 4.7,
    hoursLeft: 52,
  },
  {
    id: "m-19",
    title: "Seaport Container Stacking Density Photo Log",
    category: "PHOTO_VERIFICATION",
    urgency: "HIGH",
    budgetCents: 1700000,
    city: "Hai Phong",
    country: "Vietnam",
    uniqueScoutsCount: 8,
    estimatedTimeMins: 35,
    difficulty: "Medium",
    evidenceRequiredCount: 4,
    requesterName: "Port Logistics Corp",
    requesterReputation: 4.88,
    hoursLeft: 11,
  },
  {
    id: "m-20",
    title: "Resort Beach Area Cleanliness & Weather Monitor",
    category: "WEATHER_ON_SITE",
    urgency: "NORMAL",
    budgetCents: 1050000,
    city: "Da Nang",
    country: "Vietnam",
    uniqueScoutsCount: 6,
    estimatedTimeMins: 25,
    difficulty: "Easy",
    evidenceRequiredCount: 3,
    requesterName: "Coastal Hospitality Analytics",
    requesterReputation: 4.81,
    hoursLeft: 19,
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "trending";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let missions: MissionRecord[] = [];
    try {
      const whereClause: Record<string, unknown> = {
        status: "OPEN",
        expiresAt: { gt: new Date() },
      };

      if (category && category !== "ALL") {
        whereClause.category = category;
      }

      const dbMissions = await prisma.mission.findMany({
        where: whereClause,
        take: 50,
        include: {
          location: { select: { name: true, city: true, country: true } },
          requester: {
            select: { id: true, displayName: true, avatarUrl: true, reliabilityScore: true },
          },
          evidence: { select: { id: true, scoutId: true, createdAt: true } },
          submission: { select: { id: true, scoutId: true } },
          timelineEntries: {
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
          },
        },
      });
      missions = dbMissions as unknown as MissionRecord[];
    } catch {
      // Fallback to mock data if database is unavailable
    }

    const now = new Date().getTime();

    let scoredMissions = missions.map((m) => {
      const uniqueScoutIds = new Set<string>();
      if (m.assignedScoutId) uniqueScoutIds.add(m.assignedScoutId);
      if (m.submission?.scoutId) uniqueScoutIds.add(m.submission.scoutId);
      if (Array.isArray(m.evidence)) {
        for (const ev of m.evidence) {
          if (ev.scoutId) uniqueScoutIds.add(ev.scoutId);
        }
      }

      const uniqueScoutsCount = uniqueScoutIds.size;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const recentActivityCount =
        (m.timelineEntries || []).filter(
          (t: { createdAt: Date }) => new Date(t.createdAt).getTime() > sevenDaysAgo,
        ).length +
        (m.evidence || []).filter(
          (e: { createdAt: Date }) => new Date(e.createdAt).getTime() > sevenDaysAgo,
        ).length;

      const urgencyScore =
        m.urgency === "CRITICAL" ? 25 : m.urgency === "HIGH" ? 15 : m.urgency === "NORMAL" ? 5 : 0;
      const hoursLeft = Math.max(0.1, (new Date(m.expiresAt).getTime() - now) / (1000 * 60 * 60));
      const freshnessScore = Math.max(0, 15 - hoursLeft * 0.25);
      const requesterReputation = Math.min(
        5.0,
        Math.round(((m.requester?.reliabilityScore || 50) / 20) * 100) / 100,
      );
      const rewardCents = m.budgetCents;
      const rewardScore = Math.min(10, (rewardCents / 1000000) * 10);

      const compositeScore =
        uniqueScoutsCount * 30 +
        recentActivityCount * 20 +
        urgencyScore +
        freshnessScore +
        rewardScore +
        requesterReputation;
      const demandText =
        uniqueScoutsCount > 0 ? `${uniqueScoutsCount} scouts active` : "Open for claims";

      let trendingReason = demandText;
      if (rewardCents >= 1000000) trendingReason = "Top Bounty";
      else if (m.urgency === "CRITICAL" || hoursLeft < 12)
        trendingReason = `Due in ${Math.ceil(hoursLeft)}h`;

      const budgetLabel = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(rewardCents);

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        urgency: m.urgency,
        status: m.status,
        budgetCents: m.budgetCents,
        currency: m.currency,
        budgetLabel,
        city: m.location?.city || "Ho Chi Minh City",
        country: m.location?.country || "Vietnam",
        latitude: m.latitude,
        longitude: m.longitude,
        radiusMeters: m.radiusMeters,
        requiredTags: m.requiredTags,
        expiresAt: new Date(m.expiresAt).toISOString(),
        createdAt: new Date(m.createdAt).toISOString(),
        requester: {
          id: m.requester?.id || "req-0",
          displayName: m.requester?.displayName || "Requester",
          avatarUrl: m.requester?.avatarUrl || null,
          reputation: requesterReputation,
        },
        uniqueScoutsCount,
        demandText,
        trendingReason,
        compositeScore: Math.round(compositeScore * 10) / 10,
        estimatedTimeMins: Math.min(60, Math.max(15, Math.round((m.radiusMeters || 1500) / 50))),
        difficulty:
          (m.radiusMeters || 1500) > 3000
            ? "Advanced"
            : (m.radiusMeters || 1500) > 1500
              ? "Medium"
              : "Easy",
        evidenceRequiredCount:
          (m.requiredTags || []).length > 0 ? (m.requiredTags || []).length : 2,
      };
    });

    if (scoredMissions.length === 0) {
      scoredMissions = MOCK_20_MISSIONS.map((m) => {
        const budgetLabel = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(m.budgetCents);
        const urgencyScore = m.urgency === "CRITICAL" ? 25 : m.urgency === "HIGH" ? 15 : 5;
        const compositeScore =
          m.uniqueScoutsCount * 30 + urgencyScore + (m.budgetCents / 1000000) * 10;
        const demandText = `${m.uniqueScoutsCount} scouts active`;

        let trendingReason = demandText;
        if (m.budgetCents >= 1800000) trendingReason = "Top Bounty";
        else if (m.hoursLeft <= 4) trendingReason = `Due in ${m.hoursLeft}h`;

        return {
          id: m.id,
          title: m.title,
          description: `Detailed field intelligence observation and status audit for ${m.category}.`,
          category: m.category,
          urgency: m.urgency,
          status: "OPEN",
          budgetCents: m.budgetCents,
          currency: "VND",
          budgetLabel,
          city: m.city,
          country: m.country,
          latitude: 10.7769,
          longitude: 106.7009,
          radiusMeters: 1500,
          requiredTags: ["photo_geotag", "on_site_check"],
          expiresAt: new Date(Date.now() + m.hoursLeft * 3600 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          requester: {
            id: `req-${m.id}`,
            displayName: m.requesterName,
            avatarUrl: null,
            reputation: m.requesterReputation,
          },
          uniqueScoutsCount: m.uniqueScoutsCount,
          demandText,
          trendingReason,
          compositeScore: Math.round(compositeScore * 10) / 10,
          estimatedTimeMins: m.estimatedTimeMins,
          difficulty: m.difficulty,
          evidenceRequiredCount: m.evidenceRequiredCount,
        };
      });
    }

    if (filter === "highest_reward") {
      scoredMissions.sort((a, b) => b.budgetCents - a.budgetCents);
    } else if (filter === "most_wanted") {
      scoredMissions.sort((a, b) => b.uniqueScoutsCount - a.uniqueScoutsCount);
    } else if (filter === "ending_soon") {
      scoredMissions.sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      );
    } else {
      scoredMissions.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    const ranked = scoredMissions.slice(0, limit).map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

    return NextResponse.json({
      success: true,
      filter,
      data: ranked,
      totalCount: ranked.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[LEADERBOARD_MISSIONS_ERROR]", err?.message);
    return NextResponse.json({ error: "Failed to fetch top missions ranking" }, { status: 500 });
  }
}
