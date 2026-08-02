import { PrismaEvidenceRepository } from "@scoutx/infrastructure";
import { authenticate, requireRole } from "@/lib/auth-helpers";
import { toEvidenceDTO } from "@/lib/dto-mappers";
import { handleApiError, apiError } from "@/lib/error-mapper";

const evidenceRepo = new PrismaEvidenceRepository();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(_request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const record = await evidenceRepo.findById(id);
    if (!record) {
      return apiError("Evidence not found", 404);
    }
    return Response.json(toEvidenceDTO(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!requireRole(principal, ["ADMIN"])) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return apiError("Invalid request body", 400);
  }

  try {
    if (body.verified === true) {
      await evidenceRepo.verify(id);
    }
    const record = await evidenceRepo.findById(id);
    if (!record) {
      return apiError("Evidence not found", 404);
    }
    return Response.json(toEvidenceDTO(record));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await authenticate(_request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  if (!requireRole(principal, ["ADMIN"])) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;

  try {
    const deleted = await evidenceRepo.delete(id);
    if (!deleted) {
      return apiError("Evidence not found", 404);
    }
    return Response.json({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
