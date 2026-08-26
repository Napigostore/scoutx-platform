import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ApproveMissionSubmissionUseCase, NotFoundError, ConflictError } from "@scoutx/application";
import { AuthorizationError } from "@scoutx/auth";
import { InMemoryEventBus } from "@scoutx/events";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getApproveMissionSubmissionUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new ApproveMissionSubmissionUseCase(missionRepo, new InMemoryEventBus());
}

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
    return NextResponse.json(
      { error: "Forbidden: only requesters can approve submissions" },
      { status: 403 },
    );
  }

  const { missionId } = await params;

  try {
    const approveMissionSubmissionUseCase = getApproveMissionSubmissionUseCase();
    await approveMissionSubmissionUseCase.execute(missionId, user.id, "REQUESTER");

    // Record TimelineEntry
    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "MISSION_VERIFIED",
        summary: "Submission approved & payout reward issued by Requester",
        actorId: user.id,
        metadata: { role: "REQUESTER" },
      },
    });

    // Fetch updated mission with submission
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { submission: true },
    });

    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to approve submission";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
