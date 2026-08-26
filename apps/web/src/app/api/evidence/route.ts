import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { PrismaEvidenceRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";
import { toEvidenceDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";
import { prisma } from "@/lib/prisma";

const evidenceRepo = new PrismaEvidenceRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get("missionId");
  const scoutId = searchParams.get("scoutId");
  const pagination = parsePaginationParams(request);

  if (missionId) {
    // Use mission participant context for permission checking
    const ctx = await getMissionParticipantContext(request, missionId);
    if (!ctx || "error" in ctx) {
      return NextResponse.json(
        { error: (ctx as { error: string }).error ?? "Unauthorized" },
        { status: (ctx as { status: number }).status ?? 401 },
      );
    }
    const isRequester = ctx.participantRole === "REQUESTER" || ctx.participantRole === "ADMIN";
    // Requester sees all; recipient sees only their own
    const where = isRequester ? { missionId } : { missionId, userId: ctx.userId };
    const evidence = await prisma.evidence.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    return NextResponse.json({ evidence, total: evidence.length });
  }

  // scoutId path — original logic
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!scoutId) {
    return apiError("missionId or scoutId query parameter required", 422);
  }

  if (!requireRole(principal, ["SCOUT", "ADMIN"])) {
    return apiError("Forbidden", 403);
  }

  try {
    const evidence = await evidenceRepo.findByScoutId(scoutId);
    const total = evidence.length;
    const start = (pagination.page! - 1) * pagination.limit!;
    const paged = evidence.slice(start, start + pagination.limit!);
    const response = buildPaginatedResponse(paged.map(toEvidenceDTO), total, {
      page: pagination.page!,
      limit: pagination.limit!,
      cursor: pagination.cursor,
    });
    return Response.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!requireRole(principal, ["SCOUT", "ADMIN"])) {
    return apiError("Only scouts can upload evidence", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body", 400);
  }

  const { missionId, caption, type, mediaUrl, latitude, longitude, location, capturedAt } =
    body as Record<string, unknown>;

  if (!missionId || !caption || !type) {
    return apiError("missionId, caption, and type are required", 422);
  }

  if (!["PHOTO", "VIDEO", "NOTE"].includes(type as string)) {
    return apiError("type must be PHOTO, VIDEO, or NOTE", 422);
  }

  try {
    const record = await evidenceRepo.create({
      id: crypto.randomUUID(),
      missionId: missionId as string,
      scoutId: principal.id,
      userId: principal.id,
      caption: caption as string,
      type: type as "PHOTO" | "VIDEO" | "NOTE",
      mediaUrl: mediaUrl as string | undefined | null,
      latitude: latitude as number | undefined | null,
      longitude: longitude as number | undefined | null,
      location: location as string | undefined | null,
      capturedAt: capturedAt ? new Date(capturedAt as string) : undefined,
    });
    return Response.json(toEvidenceDTO(record), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
