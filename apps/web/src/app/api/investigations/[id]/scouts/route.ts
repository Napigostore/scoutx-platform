import { PrismaScoutRepository, PrismaMissionRepository } from "@scoutx/infrastructure";
import { authenticate } from "@/lib/auth-helpers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const scoutRepo = new PrismaScoutRepository();
const missionRepo = new PrismaMissionRepository();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(_request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const { searchParams } = new URL(_request.url);
  const includeAvailable = searchParams.get("includeAvailable") === "true";

  try {
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return apiError("Investigation not found", 404);
    }

    let assigned = null;
    if (mission.assignedScoutId) {
      assigned = await scoutRepo.findById(mission.assignedScoutId);
    }

    let available: unknown[] = [];
    if (includeAvailable) {
      const availableList = await scoutRepo.findAvailable({
        categories: [mission.category],
        maxRadiusMeters: mission.radiusMeters,
        latitude: mission.coordinates.latitude,
        longitude: mission.coordinates.longitude,
      });
      available = availableList as unknown as unknown[];
    }

    return Response.json({
      assigned,
      available,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
