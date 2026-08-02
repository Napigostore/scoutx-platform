import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import {
  CreateMissionSubmissionUseCase,
  ResubmitMissionSubmissionUseCase,
  GetCurrentUserUseCase,
  NotFoundError,
  ConflictError,
} from "@scoutx/application";
import { SimpleTokenVerifier, AuthorizationError, requireEnv } from "@scoutx/auth";
import { InMemoryEventBus } from "@scoutx/events";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const tokenVerifier = new SimpleTokenVerifier(requireEnv("JWT_SECRET"));
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
const missionRepo = new PrismaMissionRepository();
const createMissionSubmissionUseCase = new CreateMissionSubmissionUseCase(missionRepo);
const resubmitMissionSubmissionUseCase = new ResubmitMissionSubmissionUseCase(
  missionRepo,
  new InMemoryEventBus(),
);

async function authenticate(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  if (!token) return null;
  try {
    return await getCurrentUserUseCase.execute(token);
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (principal.role !== "SCOUT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bodyRecord = body as Record<string, unknown>;

  try {
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
        await resubmitMissionSubmissionUseCase.execute(missionId, principal.id, "SCOUT", {
          summary: bodyRecord.summary as string,
          mediaUrls: bodyRecord.mediaUrls as string[],
          latitude: parseFloat(bodyRecord.latitude as string) || (bodyRecord.latitude as number),
          longitude: parseFloat(bodyRecord.longitude as string) || (bodyRecord.longitude as number),
          observedAt: (bodyRecord.observedAt as string) || new Date().toISOString(),
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
      principal.id,
      "SCOUT",
    );
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
