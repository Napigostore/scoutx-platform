import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { notifyRewardRequest } from "@/lib/notification-service";

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
  if (ctx.participantRole === "REQUESTER" || ctx.participantRole === "ADMIN") {
    return NextResponse.json({ error: "Requesters cannot request a reward" }, { status: 403 });
  }
  const hasEvidence = await prisma.evidence.findFirst({ where: { missionId, userId: ctx.userId } });
  const hasSubmission = await prisma.missionSubmission.findFirst({
    where: { missionId, userId: ctx.userId },
  });
  if (!hasEvidence && !hasSubmission) {
    return NextResponse.json(
      { error: "Submit evidence or report first before requesting reward" },
      { status: 403 },
    );
  }
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { status: true, requesterId: true },
  });
  const locked = [
    "COMPLETED",
    "REWARDED",
    "VOTING_FINALIZED",
    "SETTLEMENT_PENDING",
    "COMPLETED_PENDING_SETTLEMENT",
  ];
  if (mission && locked.includes(mission.status)) {
    return NextResponse.json({ error: "Mission is already completed" }, { status: 409 });
  }
  try {
    const rewardRequest = await prisma.rewardRequest.upsert({
      where: { missionId_userId: { missionId, userId: ctx.userId } },
      create: { missionId, userId: ctx.userId, status: "PENDING" },
      update: { status: "PENDING", updatedAt: new Date() },
    });
    if (mission) await notifyRewardRequest(missionId, mission.requesterId);
    return NextResponse.json({ success: true, request: rewardRequest }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function GET(
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
  if (ctx.participantRole === "REQUESTER" || ctx.participantRole === "ADMIN") {
    const requests = await prisma.rewardRequest.findMany({
      where: { missionId },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ requests });
  }
  const own = await prisma.rewardRequest.findUnique({
    where: { missionId_userId: { missionId, userId: ctx.userId } },
  });
  return NextResponse.json({ requests: own ? [own] : [] });
}
