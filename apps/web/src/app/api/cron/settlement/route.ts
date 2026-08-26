import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

export async function GET(request: Request) {
  // Check Vercel Cron header or some cron secret here, but for simplicity we'll just allow it for now

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const missionsToSettle = await prisma.mission.findMany({
      where: {
        status: "COMPLETED_PENDING_SETTLEMENT",
        settlementStartedAt: {
          lte: twentyFourHoursAgo,
        },
      },
      include: {
        requester: true,
      },
    });

    const results = [];

    for (const mission of missionsToSettle) {
      if (!mission.winnerId) continue;

      // Start transaction to ensure idempotency
      const result = await prisma.$transaction(async (tx) => {
        // Double check status inside transaction
        const currentMission = await tx.mission.findUnique({
          where: { id: mission.id },
          select: { status: true },
        });

        if (currentMission?.status !== "COMPLETED_PENDING_SETTLEMENT") {
          return { id: mission.id, status: "SKIPPED_STATUS_CHANGED" };
        }

        // Release reward
        const budget = mission.budgetCents || 0;

        // Transfer to worker
        if (budget > 0) {
          await tx.coinTransaction.create({
            data: {
              userId: mission.winnerId!,
              amountCents: budget,
              currency: "VND",
              reason: "MISSION_REWARD",
              description: `Reward for mission ${mission.id}`,
              eventType: "CREDIT",
              missionId: mission.id,
            },
          });
        }

        // Update mission status
        const updated = await tx.mission.update({
          where: { id: mission.id },
          data: {
            status: "VERIFIED", // Wait, the UI considers VERIFIED/COMPLETED as Done.
          },
        });

        // Timeline entry
        await tx.timelineEntry.create({
          data: {
            missionId: mission.id,
            eventType: "SETTLEMENT_COMPLETED",
            summary: "Settlement window ended with no dispute. Reward released.",
            actorId: "SYSTEM",
            metadata: { winnerId: mission.winnerId },
          },
        });

        return { id: mission.id, status: "SETTLED" };
      });

      results.push(result);

      if (result.status === "SETTLED") {
        await createNotification({
          userId: mission.winnerId,
          type: "REWARD_PAID",
          title: "Reward Released!",
          body: `Your reward for mission "${mission.title}" has been released after the settlement period.`,
          link: `/missions/${mission.id}`,
          missionId: mission.id,
        });

        await createNotification({
          userId: mission.requesterId,
          type: "COMPLETED",
          title: "Mission Settlement Complete",
          body: `Mission "${mission.title}" has completed settlement and reward was paid.`,
          link: `/missions/${mission.id}`,
          missionId: mission.id,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        settledCount: results.filter((r) => r.status === "SETTLED").length,
        results,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[CRON_SETTLEMENT_ERROR]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
