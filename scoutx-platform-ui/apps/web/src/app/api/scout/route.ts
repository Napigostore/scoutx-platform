import { PrismaScoutRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const scoutRepo = new PrismaScoutRepository();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return apiError("id query parameter is required", 422);
  }

  try {
    const profile = await scoutRepo.findById(id);
    if (!profile) {
      return apiError("Scout not found", 404);
    }
    return Response.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!requireRole(principal, ["SCOUT", "ADMIN"])) {
    return apiError("Forbidden", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body", 400);
  }

  const { latitude, longitude } = body as Record<string, unknown>;

  if (latitude != null && longitude != null) {
    try {
      await scoutRepo.updateLocation(principal.id, latitude as number, longitude as number);
    } catch (error) {
      return handleApiError(error);
    }
  }

  const profile = await scoutRepo.findByUserId(principal.id);
  if (!profile) {
    return apiError("Scout profile not found", 404);
  }

  return Response.json(profile);
}
