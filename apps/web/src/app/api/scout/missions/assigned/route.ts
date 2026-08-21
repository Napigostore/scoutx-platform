import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ListScoutAssignedMissionsUseCase } from "@scoutx/application";
import { getAuthenticatedScoutContext } from "@/lib/server-auth";

const missionRepo = new PrismaMissionRepository();
const listScoutAssignedMissionsUseCase = new ListScoutAssignedMissionsUseCase(missionRepo);

export async function GET(request: Request) {
  const scoutCtx = await getAuthenticatedScoutContext(request);
  if ("error" in scoutCtx) {
    return NextResponse.json({ error: scoutCtx.error }, { status: scoutCtx.status });
  }

  try {
    const missions = await listScoutAssignedMissionsUseCase.execute(
      scoutCtx.userId,
      scoutCtx.effectiveRole,
    );
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assigned missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
