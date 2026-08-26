import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import {
  createDispute,
  fundDisputeRound,
  createReVoteRound,
} from "@/lib/dispute-settlement-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { missionId } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
  if (!user && principal.email) {
    user = await prisma.user.findUnique({ where: { email: principal.email } });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, reason, fileUrl, storageKey, explanation, fundCoins } = body as {
    action?: "CREATE" | "EVIDENCE" | "FUND" | "REVOTE";
    reason?: string;
    fileUrl?: string;
    storageKey?: string;
    explanation?: string;
    fundCoins?: number;
  };

  try {
    if (action === "CREATE" || !action) {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "Dispute reason is required" }, { status: 400 });
      }
      const dispute = await createDispute(missionId, user.id, reason.trim());
      return NextResponse.json({ success: true, dispute }, { status: 201 });
    }

    if (action === "EVIDENCE") {
      const dispute = await prisma.dispute.findUnique({ where: { missionId } });
      if (!dispute) {
        return NextResponse.json({ error: "Dispute not found for this mission" }, { status: 404 });
      }
      if (!explanation || !explanation.trim()) {
        return NextResponse.json({ error: "Evidence explanation is required" }, { status: 400 });
      }

      const evidence = await prisma.disputeEvidence.create({
        data: {
          disputeId: dispute.id,
          ownerId: user.id,
          fileUrl: fileUrl || "/api/evidence/placeholder",
          storageKey,
          explanation: explanation.trim(),
        },
      });

      return NextResponse.json({ success: true, evidence }, { status: 201 });
    }

    if (action === "FUND") {
      const dispute = await prisma.dispute.findUnique({ where: { missionId } });
      if (!dispute) {
        return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
      }
      if (!fundCoins || fundCoins <= 0) {
        return NextResponse.json({ error: "Invalid fund coin amount" }, { status: 400 });
      }

      const updatedRound = await fundDisputeRound(dispute.id, user.id, fundCoins);
      return NextResponse.json({ success: true, round: updatedRound }, { status: 200 });
    }

    if (action === "REVOTE") {
      const dispute = await prisma.dispute.findUnique({ where: { missionId } });
      if (!dispute) {
        return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
      }
      const newRound = await createReVoteRound(dispute.id, user.id);
      return NextResponse.json({ success: true, round: newRound }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid dispute action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dispute operation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
