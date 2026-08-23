import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { StartMissionUseCase } from "@scoutx/application";
import { AuthorizationError } from "@scoutx/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getStartMissionUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new StartMissionUseCase(missionRepo);
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

  if (!user || user.role !== "SCOUT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const startMissionUseCase = getStartMissionUseCase();
    const mission = await startMissionUseCase.execute(missionId, user.id, "SCOUT");

    // Record TimelineEntry
    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "WORK_STARTED",
        summary: "Scout started working on-site",
        actorId: user.id,
        metadata: { role: "SCOUT" },
      },
    });

    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start mission";
    if (
      error instanceof AuthorizationError ||
      message.includes("cannot start") ||
      message.includes("not assigned")
    ) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
