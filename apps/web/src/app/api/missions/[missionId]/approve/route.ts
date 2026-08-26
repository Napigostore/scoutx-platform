import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { notifyApproved, notifyRejected } from "@/lib/notification-service";

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
  const body = await request.json().catch(() => ({})) as { action?: string; workerId?: string };
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
  if (rewardReq.status !== "PENDING") return NextResponse.json({ error: "Already processed" }, { status: 409 });

  const updated = await prisma.rewardRequest.update({
    where: { id: rewardReq.id },
    data: { status: body.action === "APPROVE" ? "APPROVED" : "REJECTED", updatedAt: new Date() },
  });

  if (body.action === "APPROVE") {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        status: "COMPLETED_PENDING_SETTLEMENT",
        winnerId: body.workerId,
        settlementStartedAt: new Date(),
      },
    });
    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "REWARD_APPROVED",
        summary: "Requester approved reward request. Settlement started.",
        actorId: ctx.userId,
      },
    });
    await notifyApproved(missionId, body.workerId);
  } else {
    await notifyRejected(missionId, body.workerId);
  }
  return NextResponse.json({ success: true, request: updated });
}