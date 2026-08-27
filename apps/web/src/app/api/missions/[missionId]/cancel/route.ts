import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { CancelMissionUseCase } from "@scoutx/application";
import { InMemoryEventBus } from "@scoutx/events";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { recordCoinMovement } from "@/lib/coin-ledger-service";

const missionRepo = new PrismaMissionRepository();
const cancelMissionUseCase = new CancelMissionUseCase(missionRepo, new InMemoryEventBus());

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    principal.id,
  );
  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;

  if (!user && principal.email) {
    user = await prisma.user.findUnique({ where: { email: principal.email } });
  }

  if (!user || user.role !== "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  // Check if mission has participants
  const targetMission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      assignedScoutId: true,
      recipients: { select: { id: true } },
      evidence: { select: { id: true } },
      submission: { select: { id: true } },
      timelineEntries: {
        where: { actorId: { not: user.id } },
        select: { id: true },
      },
    },
  });

  if (!targetMission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  const hasParticipants =
    Boolean(targetMission.assignedScoutId) ||
    targetMission.recipients.length > 0 ||
    targetMission.evidence.length > 0 ||
    Boolean(targetMission.submission) ||
    targetMission.timelineEntries.length > 0;

  if (hasParticipants) {
    return NextResponse.json(
      { error: "Cannot cancel mission once participants have joined or submitted evidence" },
      { status: 403 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const mission = await cancelMissionUseCase.execute(missionId, user.id, user.role);

      const lockTx = await tx.coinTransaction.findFirst({
        where: { missionId, reason: "MISSION_REWARD_LOCK" },
      });

      if (lockTx) {
        const refundAmount = Math.abs(lockTx.amountCents);
        await recordCoinMovement(tx, {
          userId: user.id,
          missionId,
          type: "MISSION_REFUND",
          amountCents: refundAmount,
          description: `Refund for cancelled mission: ${mission.title}`,
          idempotencyKey: `refund-${missionId}`,
        });
      }

      await tx.mission.update({
        where: { id: missionId },
        data: { status: "CANCELLED" },
      });

      await tx.timelineEntry.create({
        data: {
          missionId,
          eventType: "MISSION_CANCELLED",
          summary: "Mission cancelled by Requester",
          actorId: user.id,
          metadata: { role: "REQUESTER" },
        },
      });

      return mission;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel mission";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
