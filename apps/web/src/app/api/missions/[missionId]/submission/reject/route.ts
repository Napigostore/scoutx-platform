import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { RejectMissionSubmissionUseCase, NotFoundError, ConflictError } from "@scoutx/application";
import { AuthorizationError } from "@scoutx/auth";
import { InMemoryEventBus } from "@scoutx/events";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getRejectMissionSubmissionUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new RejectMissionSubmissionUseCase(missionRepo, new InMemoryEventBus());
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
    return NextResponse.json(
      { error: "Forbidden: only requesters can reject submissions" },
      { status: 403 },
    );
  }

  const { missionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bodyObj = body as Record<string, unknown>;
  const rejectionReason =
    typeof bodyObj.rejectionReason === "string" ? bodyObj.rejectionReason : "";

  if (!rejectionReason.trim()) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 422 });
  }

  try {
    const rejectMissionSubmissionUseCase = getRejectMissionSubmissionUseCase();
    await rejectMissionSubmissionUseCase.execute(missionId, user.id, "REQUESTER", {
      rejectionReason,
    });

    // Fetch updated mission with submission
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { submission: true },
    });

    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to reject submission";
    if (message.includes("must be at least 5 characters") || message.includes("is required")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
