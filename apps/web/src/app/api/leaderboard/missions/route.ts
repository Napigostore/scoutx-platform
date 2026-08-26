import { NextResponse } from "next/server";
import { formatCurrency } from "@scoutx/application";
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

const CATEGORIES = [
  "STREET_CONDITIONS",
  "VENUE_STATUS",
  "LOCAL_EVENT",
  "PRODUCT_AVAILABILITY",
  "CROWD_DENSITY",
  "WEATHER_ON_SITE",
  "PHOTO_VERIFICATION",
  "GENERAL_OBSERVATION",
];

const CITIES = [
  { name: "Ho Chi Minh City", country: "Vietnam" },
  { name: "Hanoi", country: "Vietnam" },
  { name: "Da Nang", country: "Vietnam" },
  { name: "Can Tho", country: "Vietnam" },
  { name: "Hai Phong", country: "Vietnam" },
  { name: "Nha Trang", country: "Vietnam" },
  { name: "Da Lat", country: "Vietnam" },
  { name: "Phu Quoc", country: "Vietnam" },
  { name: "Tokyo", country: "Japan" },
  { name: "Singapore", country: "Singapore" },
  { name: "New York", country: "United States" },
  { name: "London", country: "United Kingdom" },
];

const REQUESTERS = [
  { name: "Global Infrastructure Group", rating: 4.98 },
  { name: "Maritime Logistics Corp", rating: 4.95 },
  { name: "VinGroup Retail Audit", rating: 4.92 },
  { name: "Urban Mobility Analytics", rating: 4.9 },
  { name: "GreenCharge Energy Asia", rating: 4.88 },
  { name: "EcoSurv Compliance Int", rating: 4.86 },
  { name: "FMCG Intelligence Co", rating: 4.84 },
  { name: "TransAsia Supply Chain", rating: 4.81 },
  { name: "BrandMetrics SEA", rating: 4.79 },
  { name: "Heritage Preservation NGO", rating: 4.75 },
];

// Generate 100 mock missions with rewards ranging from 100,000 VND ($4) to 12,500,000,000 VND ($500,000 USD)
const MOCK_100_MISSIONS = Array.from({ length: 100 }, (_, i) => {
  const num = i + 1;
  const category = CATEGORIES[i % CATEGORIES.length] || "PHOTO_VERIFICATION";
  const cityObj = CITIES[i % CITIES.length] || { name: "Ho Chi Minh City", country: "Vietnam" };
  const requester = REQUESTERS[i % REQUESTERS.length] || {
    name: "Global Intelligence",
    rating: 4.9,
  };

  let budgetCents: number;
  if (i === 0) budgetCents = 12500000000;
  else if (i === 1) budgetCents = 7500000000;
  else if (i === 2) budgetCents = 3750000000;
  else if (i === 3) budgetCents = 2500000000;
  else if (i === 4) budgetCents = 1500000000;
  else if (i < 20) budgetCents = Math.round(500000000 * Math.pow(0.85, i - 5));
  else if (i < 60) budgetCents = Math.round(25000000 * Math.pow(0.9, i - 20));
  else budgetCents = Math.max(100000, Math.round(1000000 * Math.pow(0.92, i - 60)));

  const urgency = i % 4 === 0 ? "CRITICAL" : i % 3 === 0 ? "HIGH" : i % 2 === 0 ? "NORMAL" : "LOW";
  const uniqueScoutsCount = Math.max(1, Math.floor(30 * Math.pow(0.94, i)));
  const estimatedTimeMins = 15 + (i % 6) * 10;
  const difficulty =
    budgetCents > 100000000 ? "Advanced" : budgetCents > 10000000 ? "Medium" : "Easy";
  const evidenceRequiredCount = 2 + (i % 4);
  const hoursLeft = Math.max(1, Math.ceil(48 - i * 0.45));

  return {
    id: `m-${String(num).padStart(3, "0")}`,
    title: `[Mission #${num}] Verification of ${category.replace("_", " ")} at ${cityObj.name}`,
    category,
    urgency,
    budgetCents,
    city: cityObj.name,
    country: cityObj.country,
    uniqueScoutsCount,
    estimatedTimeMins,
    difficulty,
    evidenceRequiredCount,
    requesterName: requester.name,
    requesterReputation: requester.rating,
    hoursLeft,
  };
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "trending";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let missions: MissionRecord[] = [];
    try {
      const whereClause: Record<string, unknown> = {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      };

      if (category && category !== "ALL") {
        whereClause.category = category;
      }

      let orderByClause: Record<string, unknown> = { createdAt: "desc" };
      if (filter === "highest_reward") {
        orderByClause = { budgetCents: "desc" };
      } else if (filter === "ending_soon") {
        orderByClause = { expiresAt: "asc" };
      } else if (filter === "most_wanted") {
        orderByClause = { evidence: { _count: "desc" } };
      } else {
        orderByClause = { createdAt: "desc" };
      }

      const dbMissions = await prisma.mission.findMany({
        where: whereClause,
        take: limit,
        orderBy: orderByClause,
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
      if (rewardCents >= 100000000) trendingReason = "Mega Bounty ($500k)";
      else if (rewardCents >= 1000000) trendingReason = "Top Bounty";
      else if (m.urgency === "CRITICAL" || hoursLeft < 12)
        trendingReason = `Due in ${Math.ceil(hoursLeft)}h`;

      const budgetLabel = formatCurrency(rewardCents, m.currency);

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category || "PHOTO_VERIFICATION",
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
        evidenceRequiredCount: (m.requiredTags || []).length > 0 ? (m.requiredTags || []).length : 2,
      };
    });

    if (scoredMissions.length === 0) {
      scoredMissions = MOCK_100_MISSIONS.map((m) => {
        const budgetLabel = formatCurrency(m.budgetCents, "USD");
        const urgencyScore = m.urgency === "CRITICAL" ? 25 : m.urgency === "HIGH" ? 15 : 5;
        const compositeScore = m.uniqueScoutsCount * 30 + urgencyScore + (m.budgetCents / 1000000) * 10;
        const demandText = `${m.uniqueScoutsCount} scouts active`;

        let trendingReason = demandText;
        if (m.budgetCents >= 1000000000) trendingReason = "Mega Bounty ($500k)";
        else if (m.budgetCents >= 50000000) trendingReason = "High Reward";
        else if (m.hoursLeft <= 4) trendingReason = `Due in ${m.hoursLeft}h`;

        return {
          id: m.id,
          title: m.title,
          description: `Detailed real-world intelligence observation and status audit for ${m.category} in ${m.city}.`,
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
    return NextResponse.json(
      { error: "Failed to fetch top missions ranking" },
      { status: 500 },
    );
  }
}
