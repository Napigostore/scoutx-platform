import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { CreateMissionUseCase, ListRequesterMissionsUseCase } from "@scoutx/application";
import { CreateMissionInputSchema } from "@scoutx/types";
import { prisma } from "@/lib/prisma";

import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getMissionUseCases() {
  const missionRepo = new PrismaMissionRepository();
  return {
    createMissionUseCase: new CreateMissionUseCase(missionRepo),
    listRequesterMissionsUseCase: new ListRequesterMissionsUseCase(missionRepo),
  };
}

export async function POST(request: Request) {
  console.log("[MISSION_DRAFT_DEBUG] request_received");
  try {
    console.log("[MISSION_DRAFT_DEBUG] auth_started");
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      console.log("[MISSION_DRAFT_ERROR] stage=auth message=Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[MISSION_DRAFT_DEBUG] auth_success");
    console.log("[MISSION_DRAFT_DEBUG] principal_resolved", { role: principal.role });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      principal.id,
    );
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;

    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }

    if (!user || user.role !== "REQUESTER") {
      console.log("[MISSION_DRAFT_ERROR] stage=authorization message=Forbidden");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      console.log("[MISSION_DRAFT_ERROR] stage=validation message=Invalid request body");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateMissionInputSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[MISSION_DRAFT_ERROR] stage=validation message=Validation failed");
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 422 },
      );
    }
    console.log("[MISSION_DRAFT_DEBUG] validation_success");

    console.log("[MISSION_DRAFT_DEBUG] create_mission_started");
    const { createMissionUseCase } = getMissionUseCases();
    const mission = await createMissionUseCase.execute(parsed.data, user.id, "REQUESTER");
    console.log("[MISSION_DRAFT_DEBUG] create_mission_success");

    return NextResponse.json(mission, { status: 201 });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; code?: string };
    console.error("[MISSION_DRAFT_ERROR] stage=runtime_exception", {
      name: err?.name || "Error",
      message: err?.message || "Internal server error",
      code: err?.code || "UNKNOWN",
    });
    return NextResponse.json(
      { error: err?.message || "Failed to create mission draft" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
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

    const { listRequesterMissionsUseCase } = getMissionUseCases();
    const missions = await listRequesterMissionsUseCase.execute(user.id, "REQUESTER");
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || "Failed to list missions" }, { status: 500 });
  }
}
