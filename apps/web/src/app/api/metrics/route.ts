import { NextResponse } from "next/server";
import { globalMetrics } from "@scoutx/observability";
import { prisma } from "@/lib/prisma";

import { authenticate } from "@/lib/auth-helpers";
import { apiError } from "@/lib/error-mapper";

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (principal.role !== "ADMIN") {
    return apiError("Forbidden: only admins can view metrics", 403);
  }

  try {
    const [userCounts, missionCounts, rewardAggregate, pendingWithdrawalCount, totalSubmissions] =
      await Promise.all([
        prisma.user.groupBy({
          by: ["role"],
          _count: { id: true },
        }),
        prisma.mission.groupBy({
          by: ["status"],
          _count: { id: true },
        }),
        prisma.coinTransaction.groupBy({
          by: ["eventType"],
          _sum: { amountCents: true },
          _count: { id: true },
        }),
        prisma.withdrawalRequest.count({
          where: { status: "PENDING" },
        }),
        prisma.missionSubmission.count(),
      ]);

    const usersByRole = userCounts.reduce(
      (acc, curr) => {
        acc[curr.role] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const missionsByStatus = missionCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const financialTotals = rewardAggregate.reduce(
      (acc, curr) => {
        acc[curr.eventType] = {
          totalAmountCents: curr._sum.amountCents ?? 0,
          count: curr._count.id,
        };
        return acc;
      },
      {} as Record<string, { totalAmountCents: number; count: number }>,
    );

    const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0);
    const totalMissions = Object.values(missionsByStatus).reduce((a, b) => a + b, 0);
    const claimedMissions =
      (missionsByStatus["MATCHED"] ?? 0) +
      (missionsByStatus["IN_PROGRESS"] ?? 0) +
      (missionsByStatus["SUBMITTED"] ?? 0) +
      (missionsByStatus["VERIFIED"] ?? 0) +
      (missionsByStatus["COMPLETED"] ?? 0);
    const approvedMissions =
      (missionsByStatus["VERIFIED"] ?? 0) + (missionsByStatus["COMPLETED"] ?? 0);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      betaOS: {
        betaMode: process.env.FIWOKAN_BETA_MODE === "true",
        users: {
          total: totalUsers,
          byRole: usersByRole,
        },
        missions: {
          total: totalMissions,
          byStatus: missionsByStatus,
        },
        financials: {
          pendingWithdrawalsCount: pendingWithdrawalCount,
          byEventType: financialTotals,
        },
        funnel: {
          signups: totalUsers,
          missionsCreated: totalMissions,
          missionsClaimed: claimedMissions,
          submissions: totalSubmissions,
          approvals: approvedMissions,
        },
      },
      telemetry: globalMetrics.getMetricsSnapshot(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate metrics";
    return NextResponse.json(
      { error: message, telemetry: globalMetrics.getMetricsSnapshot() },
      { status: 500 },
    );
  }
}
