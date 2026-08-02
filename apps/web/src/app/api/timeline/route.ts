import { authenticate } from "@/lib/auth-helpers";
import { toTimelineEntryDTO } from "@/lib/dto-mappers";
import { PrismaTimelineRepository } from "@scoutx/infrastructure";

import { handleApiError, apiError } from "@/lib/error-mapper";

const timelineRepo = new PrismaTimelineRepository();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get("missionId");
  const since = searchParams.get("since");

  if (!missionId) {
    return apiError("missionId query parameter is required", 422);
  }

  try {
    let entries;
    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return apiError("Invalid since date format", 422);
      }
      entries = await timelineRepo.findByMissionIdSince(missionId, sinceDate);
    } else {
      entries = await timelineRepo.findByMissionId(missionId);
    }

    return Response.json({ data: entries.map(toTimelineEntryDTO) });
  } catch (error) {
    return handleApiError(error);
  }
}
