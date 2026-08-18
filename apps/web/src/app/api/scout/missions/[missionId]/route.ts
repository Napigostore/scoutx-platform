import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { GetAvailableMissionDetailsUseCase } from "@scoutx/application";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getGetAvailableMissionDetailsUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new GetAvailableMissionDetailsUseCase(missionRepo);
}

export async function GET(
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

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;
  const missionRepo = new PrismaMissionRepository();
  const mission = await missionRepo.findById(missionId);

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  // Anti-Self-Dealing: Requester A cannot view or claim their own mission as a scout
  if (mission.requesterId === user.id) {
    return NextResponse.json(
      { error: "Requesters cannot view or claim their own missions as a scout" },
      { status: 403 },
    );
  }

  if (mission.status !== "OPEN" && mission.assignedScoutId !== user.id) {
    return NextResponse.json({ error: "Mission is not available" }, { status: 400 });
  }

  return NextResponse.json(mission, { status: 200 });
}
