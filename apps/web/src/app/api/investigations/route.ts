import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";
import { toMissionListDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";
import type { Mission } from "@scoutx/types";

const missionRepo = new PrismaMissionRepository();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const pagination = parsePaginationParams(request);

  try {
    const missions = await missionRepo.findByOwnerId(principal.id);
    const total = missions.length;
    const start = (pagination.page! - 1) * pagination.limit!;
    const paged = missions.slice(start, start + pagination.limit!);

    const response = buildPaginatedResponse(paged.map(toMissionListDTO), total, {
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

  if (!requireRole(principal, ["REQUESTER", "ADMIN"])) {
    return apiError("Forbidden: only requesters can create investigations", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body", 400);
  }

  const {
    title,
    description,
    category,
    urgency,
    budget,
    locationId,
    latitude,
    longitude,
    radiusMeters,
    requiredTags,
    expiresAt,
  } = body as Record<string, unknown>;

  if (!title || !category || !budget || !locationId || latitude == null || longitude == null) {
    return apiError(
      "title, category, budget, locationId, latitude, and longitude are required",
      422,
    );
  }

  const budgetObj = budget as Record<string, unknown>;
  if (typeof budgetObj.amountCents !== "number" || !budgetObj.currency) {
    return apiError("budget must have amountCents (number) and currency (string)", 422);
  }

  try {
    const now = new Date();
    const mission = {
      id: crypto.randomUUID(),
      title: title as string,
      description: (description as string) || "",
      category: (category as string) || "OTHER",
      status: "DRAFT" as const,
      urgency: (urgency as string) || "NORMAL",
      budget: {
        amountCents: budgetObj.amountCents as number,
        currency: budgetObj.currency as string,
      },
      locationId: locationId as string,
      coordinates: {
        latitude: latitude as number,
        longitude: longitude as number,
      },
      radiusMeters: (radiusMeters as number) || 1000,
      requesterId: principal.id,
      assignedScoutId: null,
      requiredTags: (requiredTags as string[]) || [],
      expiresAt: expiresAt
        ? new Date(expiresAt as string)
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    };

    await missionRepo.create(mission as unknown as Mission);
    return Response.json(toMissionListDTO(mission as unknown as Mission), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
