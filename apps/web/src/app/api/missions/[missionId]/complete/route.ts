import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import {
  requesterCompleteMission,
  workerRequestCompletion,
  requesterRespondCompletion,
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
  const { action, winnerId, reason } = body as {
    action?: "REQUESTER_COMPLETE" | "WORKER_COMPLETE" | "ACCEPT" | "DISPUTE";
    winnerId?: string;
    reason?: string;
  };

  try {
    if (action === "REQUESTER_COMPLETE") {
      if (!winnerId) {
        return NextResponse.json(
          { error: "Winner selection is required when completing a mission" },
          { status: 400 },
        );
      }
      const updated = await requesterCompleteMission(missionId, winnerId, user.id);
      return NextResponse.json({ success: true, mission: updated }, { status: 200 });
    }

    if (action === "WORKER_COMPLETE") {
      const updated = await workerRequestCompletion(missionId, user.id);
      return NextResponse.json({ success: true, mission: updated }, { status: 200 });
    }

    if (action === "ACCEPT" || action === "DISPUTE") {
      const updated = await requesterRespondCompletion(missionId, action, user.id, reason);
      return NextResponse.json({ success: true, mission: updated }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute completion action";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
