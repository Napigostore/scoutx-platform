import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "trending";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const whereClause: Record<string, unknown> = {
      status: "OPEN",
      expiresAt: { gt: new Date() },
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const missions = await prisma.mission.findMany({
      where: whereClause,
      take: 50,
      include: {
        location: {
          select: {
            name: true,
            city: true,
            country: true,
          },
        },
        requester: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            reliabilityScore: true,
          },
        },
        evidence: {
          select: {
            id: true,
            scoutId: true,
            createdAt: true,
          },
        },
        submission: {
          select: {
            id: true,
            scoutId: true,
          },
        },
        timelineEntries: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    const now = new Date().getTime();

    const scoredMissions = missions.map((m) => {
      // 1. Calculate UNIQUE scouts interested/active for Most Wanted metric (no double-counting)
      const uniqueScoutIds = new Set<string>();

      if (m.assignedScoutId) {
        uniqueScoutIds.add(m.assignedScoutId);
      }
      if (m.submission?.scoutId) {
        uniqueScoutIds.add(m.submission.scoutId);
      }
      if (Array.isArray(m.evidence)) {
        for (const ev of m.evidence) {
          if (ev.scoutId) {
            uniqueScoutIds.add(ev.scoutId);
          }
        }
      }

      const uniqueScoutsCount = uniqueScoutIds.size;

      // 2. Count recent activity in last 7 days
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const recentActivityCount =
        m.timelineEntries.filter((t) => new Date(t.createdAt).getTime() > sevenDaysAgo).length +
        m.evidence.filter((e) => new Date(e.createdAt).getTime() > sevenDaysAgo).length;

      // 3. Urgency & Freshness Score
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

      // Composite score for Trending
      const compositeScore =
        uniqueScoutsCount * 30 +
        recentActivityCount * 20 +
        urgencyScore +
        freshnessScore +
        rewardScore +
        requesterReputation;

      // Transparent UI Metric Labels
      const demandText =
        uniqueScoutsCount > 0 ? `${uniqueScoutsCount} scouts active` : "Open for claims";

      let trendingReason = demandText;
      if (rewardCents >= 1000000) trendingReason = "Top Bounty";
      else if (m.urgency === "CRITICAL" || hoursLeft < 12)
        trendingReason = `Due in ${Math.ceil(hoursLeft)}h`;
      else if (uniqueScoutsCount > 0) trendingReason = demandText;

      const amount = m.budgetCents;
      const currency = m.currency?.trim().toUpperCase() || "VND";
      const budgetLabel =
        currency === "VND"
          ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
          : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
              amount / 100,
            );

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
        expiresAt: m.expiresAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
        requester: {
          id: m.requester.id,
          displayName: m.requester.displayName,
          avatarUrl: m.requester.avatarUrl,
          reputation: requesterReputation,
        },
        uniqueScoutsCount,
        demandText,
        trendingReason,
        compositeScore: Math.round(compositeScore * 10) / 10,
        estimatedTimeMins: Math.min(60, Math.max(15, Math.round(m.radiusMeters / 50))),
        difficulty: m.radiusMeters > 3000 ? "Advanced" : m.radiusMeters > 1500 ? "Medium" : "Easy",
        evidenceRequiredCount: m.requiredTags.length > 0 ? m.requiredTags.length : 2,
      };
    });

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
