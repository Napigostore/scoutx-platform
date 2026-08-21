import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { GetScoutAssignedMissionDetailsUseCase } from "@scoutx/application";
import { getAuthenticatedScoutContext } from "@/lib/server-auth";

const missionRepo = new PrismaMissionRepository();
const getScoutAssignedMissionDetailsUseCase = new GetScoutAssignedMissionDetailsUseCase(
  missionRepo,
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const scoutCtx = await getAuthenticatedScoutContext(request);
  if ("error" in scoutCtx) {
    return NextResponse.json({ error: scoutCtx.error }, { status: scoutCtx.status });
  }

  const { missionId } = await params;

  try {
    const mission = await getScoutAssignedMissionDetailsUseCase.execute(
      missionId,
      scoutCtx.userId,
      scoutCtx.effectiveRole,
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
