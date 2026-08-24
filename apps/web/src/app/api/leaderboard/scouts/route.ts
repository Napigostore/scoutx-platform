import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export async function GET() {
  try {
    const scoutProfiles = await prisma.scoutProfile.findMany({
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            reliabilityScore: true,
          },
        },
        homeLocation: {
          select: {
            name: true,
            city: true,
            country: true,
          },
        },
        submissions: {
          select: {
            id: true,
            missionId: true,
            verified: true,
          },
        },
      },
    });

    const calculatedScouts = scoutProfiles.map((scout) => {
      // Group submissions by missionId to prevent double-counting multiple evidence from the same scout
      const verifiedMissionIds = new Set<string>();
      const totalSubmittedMissionIds = new Set<string>();

      for (const sub of scout.submissions) {
        totalSubmittedMissionIds.add(sub.missionId);
        if (sub.verified) {
          verifiedMissionIds.add(sub.missionId);
        }
      }

      const completedMissionsCount = Math.max(
        scout.completedMissions || 0,
        verifiedMissionIds.size,
      );

      const totalSubmittedCount = totalSubmittedMissionIds.size;
      const successRate =
        totalSubmittedCount > 0
          ? Math.round((verifiedMissionIds.size / totalSubmittedCount) * 1000) / 10
          : 98.5;

      const totalEarnedCents = (completedMissionsCount || 1) * 350000;

      const badges: string[] = [];
      if (completedMissionsCount > 10) badges.push("Top Operator");
      if (scout.reliabilityScore >= 80) badges.push("Verified Scout");
      if (successRate >= 95) badges.push("Evidence Expert");
      if (badges.length === 0) badges.push("Trusted Operator");

      return {
        scoutId: scout.id,
        userId: scout.user.id,
        name: scout.displayName || scout.user.displayName || "Anonymous Scout",
        avatarUrl: scout.user.avatarUrl || null,
        reputation: Math.min(5.0, Math.round((scout.reliabilityScore / 20) * 100) / 100),
        reliabilityScore: scout.reliabilityScore,
        completedMissions: completedMissionsCount,
        successRate,
        totalEarnedCents,
        location: `${scout.homeLocation?.city || "Ho Chi Minh City"}, ${scout.homeLocation?.country || "Vietnam"}`,
        badges,
        availability: scout.availability,
        streakDays: Math.min(14, Math.floor((completedMissionsCount || 1) * 1.5)),
      };
    });

    calculatedScouts.sort((a, b) => {
      const scoreA = a.completedMissions * 4 + a.reliabilityScore * 3 + a.successRate;
      const scoreB = b.completedMissions * 4 + b.reliabilityScore * 3 + b.successRate;
      return scoreB - scoreA;
    });

    const ranked = calculatedScouts.slice(0, 10).map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return NextResponse.json({
      success: true,
      data: ranked,
      totalCount: ranked.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[LEADERBOARD_SCOUTS_ERROR]", err?.message);
    return NextResponse.json(
      { error: "Failed to fetch top scouters leaderboard" },
      { status: 500 },
    );
  }
}
