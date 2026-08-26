import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawDisputes = await prisma.dispute.findMany({
      where: {
        mission: {
          visibility: "PUBLIC",
        },
      },
      take: 20,
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            category: true,
            budgetCents: true,
            currency: true,
            status: true,
            visibility: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: "desc" },
          take: 1,
        },
        votes: {
          select: { id: true },
        },
      },
    });

    const now = new Date().getTime();

    const rankedDisputes = rawDisputes
      .map((d) => {
        const latestRound = d.rounds[0];
        const voteCount = d.votes.length;
        const endsAtMs = latestRound ? new Date(latestRound.endsAt).getTime() : now;
        const timeRemainingMs = Math.max(0, endsAtMs - now);
        const rewardUSD = Math.round((d.mission.budgetCents || 0) / 100);

        return {
          id: d.id,
          missionId: d.missionId,
          title: d.mission.title,
          category: d.mission.category,
          missionStatus: d.mission.status,
          disputeStatus: d.status,
          fundedCoin: d.fundedCoin,
          voteCount,
          minVotesRequired: latestRound?.minVotesRequired || 50,
          roundNumber: latestRound?.roundNumber || 1,
          roundStatus: latestRound?.status || "ACTIVE",
          rewardFormatted: `$${rewardUSD}`,
          timeRemainingMs,
          ctaText: "View & Vote 🗳️",
        };
      })
      .sort((a, b) => {
        if (b.fundedCoin !== a.fundedCoin) return b.fundedCoin - a.fundedCoin;
        if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
        return a.timeRemainingMs - b.timeRemainingMs;
      })
      .slice(0, 10);

    return NextResponse.json({ success: true, disputes: rankedDisputes }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch top disputes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
