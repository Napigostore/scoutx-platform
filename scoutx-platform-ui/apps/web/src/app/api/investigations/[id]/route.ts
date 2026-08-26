import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { toMissionDetailDTO } from "@/lib/dto-mappers";
import type { Mission } from "@scoutx/types";
import { handleApiError, apiError } from "@/lib/error-mapper";

const missionRepo = new PrismaMissionRepository();
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(_request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return apiError("Investigation not found", 404);
    }

    if (mission.requesterId !== principal.id && !requireRole(principal, ["ADMIN"])) {
      return apiError("Forbidden", 403);
    }

    return Response.json(toMissionDetailDTO(mission));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body", 400);
  }

  try {
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return apiError("Investigation not found", 404);
    }

    if (mission.requesterId !== principal.id && !requireRole(principal, ["ADMIN"])) {
      return apiError("Forbidden", 403);
    }

    const { title, description, urgency, radiusMeters, requiredTags, expiresAt, status } =
      body as Record<string, unknown>;

    const updated = {
      ...mission,
      ...(title !== undefined ? { title: title as string } : {}),
      ...(description !== undefined ? { description: description as string } : {}),
      ...(urgency !== undefined ? { urgency: urgency as string } : {}),
      ...(radiusMeters !== undefined ? { radiusMeters: radiusMeters as number } : {}),
      ...(requiredTags !== undefined ? { requiredTags: requiredTags as string[] } : {}),
      ...(expiresAt !== undefined ? { expiresAt: new Date(expiresAt as string) } : {}),
      ...(status !== undefined ? { status: status as string } : {}),
      updatedAt: new Date(),
    };

    await missionRepo.update(updated as unknown as Mission);
    return Response.json(toMissionDetailDTO(updated as unknown as Mission));
  } catch (error) {
    return handleApiError(error);
  }
}
