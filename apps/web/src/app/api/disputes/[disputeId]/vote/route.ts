import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { submitDisputeVote } from "@/lib/dispute-settlement-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { disputeId } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
  if (!user && principal.email) {
    user = await prisma.user.findUnique({ where: { email: principal.email } });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { roundId, selectedSide } = body as {
    roundId?: string;
    selectedSide?: "REQUESTER_WIN" | "WORKER_WIN";
  };

  if (!roundId) {
    return NextResponse.json({ error: "Round ID is required for voting" }, { status: 400 });
  }

  if (selectedSide !== "REQUESTER_WIN" && selectedSide !== "WORKER_WIN") {
    return NextResponse.json({ error: "Invalid selected side" }, { status: 400 });
  }

  try {
    const vote = await submitDisputeVote(disputeId, roundId, user.id, selectedSide);
    return NextResponse.json(
      {
        success: true,
        message: "Vote recorded successfully! +1 Coin reward credited to your wallet.",
        vote,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record vote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
