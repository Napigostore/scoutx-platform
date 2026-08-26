import { PrismaEvidenceRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";
import { toEvidenceDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const evidenceRepo = new PrismaEvidenceRepository();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get("missionId");
  const scoutId = searchParams.get("scoutId");
  const pagination = parsePaginationParams(request);

  try {
    let evidence;
    if (missionId) {
      evidence = await evidenceRepo.findByMissionId(missionId);
    } else if (scoutId) {
      if (!requireRole(principal, ["SCOUT", "ADMIN"])) {
        return apiError("Forbidden", 403);
      }
      evidence = await evidenceRepo.findByScoutId(scoutId);
    } else {
      return apiError("missionId or scoutId query parameter required", 422);
    }

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
