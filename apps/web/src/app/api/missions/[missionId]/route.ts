import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { GetMissionDetailsUseCase, UpdateMissionUseCase } from "@scoutx/application";
import { CreateMissionInputSchema } from "@scoutx/types";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getMissionUseCases() {
  const missionRepo = new PrismaMissionRepository();
  return {
    getMissionDetailsUseCase: new GetMissionDetailsUseCase(missionRepo),
    updateMissionUseCase: new UpdateMissionUseCase(missionRepo),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: principal.id } });
  if (!user || user.role !== "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const { getMissionDetailsUseCase } = getMissionUseCases();
    const mission = await getMissionDetailsUseCase.execute(missionId, principal.id, "REQUESTER");

    // Fetch submission if status is SUBMITTED or later
    let submission = null;
    if (
      mission.status === "SUBMITTED" ||
      mission.status === "VERIFIED" ||
      mission.status === "COMPLETED"
    ) {
      submission = await prisma.missionSubmission.findFirst({
        where: { missionId },
      });
    }

    return NextResponse.json({ ...mission, submission }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get mission details";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: principal.id } });
  if (!user || user.role !== "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CreateMissionInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 422 },
    );
  }

  try {
    const { updateMissionUseCase } = getMissionUseCases();
    const mission = await updateMissionUseCase.execute(
      missionId,
      parsed.data,
      principal.id,
      "REQUESTER",
    );
    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update mission";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
