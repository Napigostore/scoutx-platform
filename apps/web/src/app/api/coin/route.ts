import { PrismaCoinRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { parsePaginationParams, buildPaginatedResponse } from "@/lib/pagination";
import { toCoinTransactionDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const coinRepo = new PrismaCoinRepository();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const missionId = searchParams.get("missionId");
  const pagination = parsePaginationParams(request);

  try {
    let transactions;
    let total: number;

    if (missionId) {
      const items = await coinRepo.findByMissionId(missionId);
      transactions = items;
      total = items.length;
    } else if (userId) {
      const items = await coinRepo.findByUserId(userId || principal.id);
      transactions = items;
      total = items.length;
    } else {
      const items = await coinRepo.findByUserId(principal.id);
      transactions = items;
      total = items.length;
    }

    const start = (pagination.page! - 1) * pagination.limit!;
    const paged = transactions.slice(start, start + pagination.limit!);

    const balance = await coinRepo.balanceByUserId(userId || principal.id);

    const response = buildPaginatedResponse(paged.map(toCoinTransactionDTO), total, {
      page: pagination.page!,
      limit: pagination.limit!,
      cursor: pagination.cursor,
    });
    return Response.json({ ...response, balance });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!requireRole(principal, ["ADMIN"])) {
    return apiError("Forbidden: only admins can create transactions", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body", 400);
  }

  const { userId, amountCents, reason, description, eventType, missionId } = body as Record<
    string,
    unknown
  >;

  if (!userId || !amountCents || !reason || !eventType) {
    return apiError("userId, amountCents, reason, and eventType are required", 422);
  }

  try {
    const record = await coinRepo.create({
      id: crypto.randomUUID(),
      userId: userId as string,
      amountCents: amountCents as number,
      reason: reason as string,
      description: (description as string) ?? null,
      eventType: eventType as string,
      missionId: (missionId as string) ?? null,
    });
    return Response.json(toCoinTransactionDTO(record), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
