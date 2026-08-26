import { PrismaTrustRepository, PrismaMissionRepository } from "@scoutx/infrastructure";
import { authenticate } from "@/lib/auth-helpers";
import { toTrustScoreDTO, toTrustActionDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const trustRepo = new PrismaTrustRepository();
const missionRepo = new PrismaMissionRepository();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(_request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const { searchParams } = new URL(_request.url);
  const scoutId = searchParams.get("scoutId");

  try {
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return apiError("Investigation not found", 404);
    }

    if (scoutId) {
      const score = await trustRepo.findScoreByUserId(scoutId);
      if (!score) {
        return apiError("Trust score not found for scout", 404);
      }
      const actions = await trustRepo.findActionsByTargetId(scoutId);
      return Response.json({
        score: toTrustScoreDTO(score),
        actions: actions.map(toTrustActionDTO),
      });
    }

    // Return trust info for assigned scout
    if (!mission.assignedScoutId) {
      return Response.json({ score: null, actions: [] });
    }

    const score = await trustRepo.findScoreByUserId(mission.assignedScoutId);
    const actions = await trustRepo.findActionsByTargetId(mission.assignedScoutId);
    return Response.json({
      score: score ? toTrustScoreDTO(score) : null,
      actions: actions.map(toTrustActionDTO),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
