import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { GetScoutAssignedMissionDetailsUseCase } from "@scoutx/application";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

const missionRepo = new PrismaMissionRepository();
const getScoutAssignedMissionDetailsUseCase = new GetScoutAssignedMissionDetailsUseCase(
  missionRepo,
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId: principal.id },
  });

  if (principal.role !== "SCOUT" && !scoutProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const mission = await getScoutAssignedMissionDetailsUseCase.execute(
      missionId,
      principal.id,
      "SCOUT",
    );
    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get assigned mission details";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
