import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { PublishMissionUseCase } from "@scoutx/application";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getPublishMissionUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new PublishMissionUseCase(missionRepo);
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const publishMissionUseCase = getPublishMissionUseCase();
    const mission = await publishMissionUseCase.execute(missionId, user.id, "REQUESTER");
    // Ensure DB state is updated to OPEN and return latest DB state
    await prisma.mission
      .update({
        where: { id: missionId },
        data: { status: "OPEN", updatedAt: new Date() },
      })
      .catch(() => null);

    return NextResponse.json({ ...mission, status: "OPEN" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish mission";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
