import { PrismaCoinRepository, PrismaMissionRepository } from "@scoutx/infrastructure";
import { authenticate } from "@/lib/auth-helpers";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";
import { toCoinTransactionDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const coinRepo = new PrismaCoinRepository();
const missionRepo = new PrismaMissionRepository();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const pagination = parsePaginationParams(request);

  try {
    const mission = await missionRepo.findById(id);
    if (!mission) {
      return apiError("Investigation not found", 404);
    }

    const transactions = await coinRepo.findByMissionId(id);
    const total = transactions.length;
    const start = (pagination.page! - 1) * pagination.limit!;
    const paged = transactions.slice(start, start + pagination.limit!);
    const totalCoins = await coinRepo.sumByMissionId(id);

    const response = buildPaginatedResponse(paged.map(toCoinTransactionDTO), total, {
      page: pagination.page!,
      limit: pagination.limit!,
      cursor: pagination.cursor,
    });
    return Response.json({ ...response, totalCoins });
  } catch (error) {
    return handleApiError(error);
  }
}
