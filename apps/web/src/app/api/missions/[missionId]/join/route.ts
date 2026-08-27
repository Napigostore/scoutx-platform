import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { notifyMissionJoined } from "@/lib/notification-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
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
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { id: true, status: true, requesterId: true },
  });

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  if (mission.requesterId === user.id) {
    return NextResponse.json(
      { error: "Requesters cannot join their own mission" },
      { status: 400 },
    );
  }

  const lockedStatuses = [
    "COMPLETED",
    "REWARDED",
    "CANCELLED",
    "EXPIRED",
    "COMPLETED_PENDING_SETTLEMENT",
    "SETTLEMENT_PENDING",
  ];
  if (lockedStatuses.includes(mission.status)) {
    return NextResponse.json(
      { error: "Cannot join a mission that is completed or expired" },
      { status: 409 },
    );
  }

  try {
    await prisma.missionRecipient.upsert({
      where: { missionId_userId: { missionId, userId: user.id } },
      create: { missionId, userId: user.id },
      update: {},
    });

    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "SCOUT_ASSIGNED",
        summary: `${user.displayName || "Scout"} joined the mission`,
        actorId: user.id,
        metadata: { role: "SCOUT" },
      },
    });

    await notifyMissionJoined(missionId, user.id);

    return NextResponse.json({ success: true, message: "Joined mission successfully" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to join mission";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
