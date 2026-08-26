import { PrismaTrustRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { toTrustScoreDTO, toTrustActionDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const trustRepo = new PrismaTrustRepository();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return apiError("userId query parameter is required", 422);
  }

  try {
    const score = await trustRepo.findScoreByUserId(userId);
    if (!score) {
      return apiError("Trust score not found", 404);
    }
    return Response.json(toTrustScoreDTO(score));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!requireRole(principal, ["REQUESTER", "SCOUT", "ADMIN"])) {
    return apiError("Forbidden", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body", 400);
  }

  const { targetId, action, missionId } = body as Record<string, unknown>;

  if (!targetId || !action) {
    return apiError("targetId and action are required", 422);
  }

  const validActions = ["VERIFIED", "DISPUTED", "ENDORSED", "BADGE_EARNED"];
  if (!validActions.includes(action as string)) {
    return apiError(`action must be one of: ${validActions.join(", ")}`, 422);
  }

  try {
    const record = await trustRepo.createAction({
      id: crypto.randomUUID(),
      actorId: principal.id,
      targetId: targetId as string,
      action: action as "VERIFIED" | "DISPUTED" | "ENDORSED" | "BADGE_EARNED",
      missionId: (missionId as string) ?? null,
    });

    const actions = await trustRepo.findActionsByTargetId(targetId as string);
    const totalPoints = actions.reduce((sum, a) => {
      switch (a.action) {
        case "VERIFIED":
          return sum + 5;
        case "ENDORSED":
          return sum + 3;
        case "BADGE_EARNED":
          return sum + 10;
        case "DISPUTED":
          return sum - 5;
        default:
          return sum;
      }
    }, 80);
    const clampedScore = Math.max(0, Math.min(100, totalPoints));

    await trustRepo.upsertScore(targetId as string, clampedScore);
    const updatedScore = await trustRepo.findScoreByUserId(targetId as string);

    return Response.json(
      {
        action: toTrustActionDTO(record),
        score: updatedScore ? toTrustScoreDTO(updatedScore) : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
