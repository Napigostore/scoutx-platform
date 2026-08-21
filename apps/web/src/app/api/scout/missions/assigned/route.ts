import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ListScoutAssignedMissionsUseCase } from "@scoutx/application";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

const missionRepo = new PrismaMissionRepository();
const listScoutAssignedMissionsUseCase = new ListScoutAssignedMissionsUseCase(missionRepo);

export async function GET(request: Request) {
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

  try {
    const missions = await listScoutAssignedMissionsUseCase.execute(principal.id, "SCOUT");
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assigned missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
