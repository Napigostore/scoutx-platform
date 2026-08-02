import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import {
  RejectMissionSubmissionUseCase,
  NotFoundError,
  ConflictError,
  GetCurrentUserUseCase,
} from "@scoutx/application";
import { SimpleTokenVerifier, AuthorizationError } from "@scoutx/auth";
import { InMemoryEventBus } from "@scoutx/events";
import { prisma } from "@/lib/prisma";

const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
const missionRepo = new PrismaMissionRepository();
const rejectMissionSubmissionUseCase = new RejectMissionSubmissionUseCase(
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

  if (principal.role !== "REQUESTER") {
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
    await rejectMissionSubmissionUseCase.execute(missionId, principal.id, "REQUESTER", {
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
