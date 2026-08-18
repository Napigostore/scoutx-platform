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

  if (!user || user.role !== "SCOUT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const getAvailableMissionDetailsUseCase = getGetAvailableMissionDetailsUseCase();
    const mission = await getAvailableMissionDetailsUseCase.execute(missionId, "SCOUT");
    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get available mission details";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
