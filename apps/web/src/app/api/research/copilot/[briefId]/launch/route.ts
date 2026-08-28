import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import {
  publishCopilotBriefAsLiveMission,
  getMissionFromBrief,
} from "@/lib/copilot-publish-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ briefId: string }> };

/**
 * POST /api/research/copilot/[briefId]/launch
 *
 * Human-gated. Only the Requester who owns the brief (or ADMIN) can call this.
 * Atomically creates Mission + Survey + Escrow from an APPROVED Copilot brief.
 */
export async function POST(request: Request, { params }: Params) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve DB user for role check
  const user = await prisma.user
    .findFirst({
      where: {
        OR: [{ id: principal.id }, ...(principal.email ? [{ email: principal.email }] : [])],
      },
      select: { id: true, role: true },
    })
    .catch(() => null);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== "REQUESTER" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only REQUESTER or ADMIN can launch missions" },
      { status: 403 },
    );
  }

  const { briefId } = await params;

  try {
    const result = await publishCopilotBriefAsLiveMission(briefId, user.id);
    return NextResponse.json({
      success: true,
      message: "Mission created and published successfully",
      missionId: result.missionId,
      briefId: result.briefId,
      status: result.status,
      escrowedCents: result.escrowedCents,
      platformFeeCents: result.platformFeeCents,
      surveyQuestionsCreated: result.surveyQuestionsCreated,
      eligibleCount: result.eligibleCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Launch failed";
    const status =
      message.includes("forbidden") || message.includes("not found")
        ? 404
        : message.includes("Insufficient")
          ? 402
          : message.includes("APPROVED")
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * GET /api/research/copilot/[briefId]/launch
 *
 * Returns the mission created from this brief, if any.
 */
export async function GET(request: Request, { params }: Params) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user
    .findFirst({
      where: {
        OR: [{ id: principal.id }, ...(principal.email ? [{ email: principal.email }] : [])],
      },
      select: { id: true },
    })
    .catch(() => null);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { briefId } = await params;

  try {
    const mission = await getMissionFromBrief(briefId, user.id);
    return NextResponse.json({ mission: mission ?? null });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 },
    );
  }
}
