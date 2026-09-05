import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import {
  notifyApproved,
  notifyRejected,
  notifyRewardPaid,
  notifyNonWinners,
} from "@/lib/notification-service";
import { checkIsSoleWorker } from "@/lib/dispute-settlement-service";
import { recordCoinMovement } from "@/lib/coin-ledger-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
  const ctx = await getMissionParticipantContext(request, missionId);
  if (!ctx || "error" in ctx) {
    return NextResponse.json(
      { error: (ctx as { error: string }).error ?? "Unauthorized" },
      { status: (ctx as { status: number }).status ?? 401 },
    );
  }
  if (ctx.participantRole !== "REQUESTER" && ctx.participantRole !== "ADMIN") {
    return NextResponse.json({ error: "Only the requester can approve" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { action?: string; workerId?: string };
  if (!body.action || !body.workerId) {
    return NextResponse.json({ error: "action and workerId required" }, { status: 400 });
  }
  if (body.action !== "APPROVE" && body.action !== "REJECT") {
    return NextResponse.json({ error: "action must be APPROVE or REJECT" }, { status: 400 });
  }
  const rewardReq = await prisma.rewardRequest.findUnique({
    where: { missionId_userId: { missionId, userId: body.workerId } },
  });
  if (!rewardReq) return NextResponse.json({ error: "Reward request not found" }, { status: 404 });
  if (rewardReq.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  const updated = await prisma.rewardRequest.update({
    where: { id: rewardReq.id },
    data: { status: body.action === "APPROVE" ? "APPROVED" : "REJECTED", updatedAt: new Date() },
  });

  if (body.action === "APPROVE") {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { id: true, title: true, budgetCents: true, requesterId: true },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const isSole = await checkIsSoleWorker(missionId, body.workerId, mission.requesterId);
    const now = new Date();
    const rewardCents = mission.budgetCents || 1000;

    if (isSole) {
      // Sole worker on mission: payout immediately without waiting 24h
      await prisma.$transaction(async (tx) => {
        await recordCoinMovement(tx, {
          userId: body.workerId!,
          missionId,
          type: "MISSION_REWARD_RELEASE",
          amountCents: rewardCents,
          description: `Instant reward payout for sole worker on mission: ${mission.title}`,
          idempotencyKey: `release-${mission.id}`,
        });

        await tx.mission.update({
          where: { id: missionId },
          data: {
            status: "REWARDED",
            winnerId: body.workerId,
            rewardReleasedAt: now,
            settlementStartedAt: now,
          },
        });

        await tx.timelineEntry.create({
          data: {
            missionId,
            eventType: "REWARD_RELEASED",
            summary: `Requester approved reward request. Sole worker rewarded immediately ($${Math.round(rewardCents / 100)}).`,
            actorId: ctx.userId,
            metadata: { winnerId: body.workerId, instantPayout: true, rewardCents },
          },
        });
      });

      await notifyApproved(missionId, body.workerId);
      await notifyRewardPaid(missionId, body.workerId);
    } else {
      // Multiple workers: 24h dispute cooldown
      await prisma.mission.update({
        where: { id: missionId },
        data: {
          status: "COMPLETED_PENDING_SETTLEMENT",
          winnerId: body.workerId,
          settlementStartedAt: now,
        },
      });
      await prisma.timelineEntry.create({
        data: {
          missionId,
          eventType: "REWARD_APPROVED",
          summary: "Requester approved reward request. Settlement countdown (+24h) started.",
          actorId: ctx.userId,
          metadata: { winnerId: body.workerId, settlementStartedAt: now.toISOString() },
        },
      });
      await notifyApproved(missionId, body.workerId);
      await notifyNonWinners(missionId, body.workerId).catch(() => {});
    }
  } else {
    await notifyRejected(missionId, body.workerId);
  }
  return NextResponse.json({ success: true, request: updated });
}
