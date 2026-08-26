import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import {
  CreateMissionSubmissionUseCase,
  ResubmitMissionSubmissionUseCase,
  NotFoundError,
  ConflictError,
} from "@scoutx/application";
import { AuthorizationError } from "@scoutx/auth";
import { InMemoryEventBus } from "@scoutx/events";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getSubmissionUseCases() {
  const missionRepo = new PrismaMissionRepository();
  const createMissionSubmissionUseCase = new CreateMissionSubmissionUseCase(missionRepo);
  const resubmitMissionSubmissionUseCase = new ResubmitMissionSubmissionUseCase(
    missionRepo,
    new InMemoryEventBus(),
  );
  return { createMissionSubmissionUseCase, resubmitMissionSubmissionUseCase };
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

  if (!user || user.role !== "SCOUT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bodyRecord = body as Record<string, unknown>;

  try {
    const { createMissionSubmissionUseCase, resubmitMissionSubmissionUseCase } =
      getSubmissionUseCases();

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { status: true },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (mission.status === "IN_PROGRESS") {
      const existingSubmission = await prisma.missionSubmission.findFirst({
        where: { missionId },
        select: { id: true },
      });

      if (existingSubmission) {
        await resubmitMissionSubmissionUseCase.execute(missionId, user.id, "SCOUT", {
          summary: bodyRecord.summary as string,
          mediaUrls: bodyRecord.mediaUrls as string[],
          latitude: parseFloat(bodyRecord.latitude as string) || (bodyRecord.latitude as number),
          longitude: parseFloat(bodyRecord.longitude as string) || (bodyRecord.longitude as number),
          observedAt: (bodyRecord.observedAt as string) || new Date().toISOString(),
        });

        await prisma.timelineEntry.create({
          data: {
            missionId,
            eventType: "MISSION_SUBMITTED",
            summary: "Scout resubmitted work for review",
            actorId: user.id,
            metadata: { role: "SCOUT", isResubmission: true },
          },
        });

        const updatedSubmission = await prisma.missionSubmission.findFirst({
          where: { missionId },
        });

        return NextResponse.json(updatedSubmission, { status: 200 });
      }
    }

    const submission = await createMissionSubmissionUseCase.execute(
      missionId,
      body,
      user.id,
      "SCOUT",
    );

    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "MISSION_SUBMITTED",
        summary: "Scout submitted work for review",
        actorId: user.id,
        metadata: { role: "SCOUT" },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Mission was already submitted" }, { status: 409 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to submit mission";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
