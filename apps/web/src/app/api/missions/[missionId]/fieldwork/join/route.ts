import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { reserveSlot, startSurvey, getWorkerFieldworkView } from "@/lib/fieldwork-service";

/**
 * GET /api/missions/[missionId]/fieldwork/join
 * Worker view — aggregate data, no PII
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { missionId } = await params;
  try {
    const view = await getWorkerFieldworkView(missionId);
    return NextResponse.json(view);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 },
    );
  }
}

/**
 * POST /api/missions/[missionId]/fieldwork/join
 * Atomically reserves a slot for the worker
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { missionId } = await params;

  const result = await reserveSlot(missionId, principal.id);
  if (!result.success) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({ success: true, participantId: result.participantId });
}
