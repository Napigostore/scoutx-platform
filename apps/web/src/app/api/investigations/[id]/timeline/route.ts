import { PrismaTimelineRepository, PrismaMissionRepository } from "@scoutx/infrastructure";
import { authenticate } from "@/lib/auth-helpers";
import { toTimelineEntryDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const timelineRepo = new PrismaTimelineRepository();
const missionRepo = new PrismaMissionRepository();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(_request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const { searchParams } = new URL(_request.url);
  const since = searchParams.get("since");

  try {
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return apiError("Investigation not found", 404);
    }

    let entries;
    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return apiError("Invalid since date format", 422);
      }
      entries = await timelineRepo.findByMissionIdSince(id, sinceDate);
    } else {
      entries = await timelineRepo.findByMissionId(id);
    }

    return Response.json({ data: entries.map(toTimelineEntryDTO) });
  } catch (error) {
    return handleApiError(error);
  }
}
