import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;

  // 1. Mission Participant Authorization Check (Requester or Assigned Scout)
  const participantCtx = await getMissionParticipantContext(request, missionId);
  if (!participantCtx || "error" in participantCtx) {
    const errorMsg =
      participantCtx && "error" in participantCtx ? participantCtx.error : "Unauthorized";
    const errorStatus = participantCtx && "status" in participantCtx ? participantCtx.status : 401;
    return NextResponse.json({ error: errorMsg }, { status: errorStatus });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { type, message } = body as { type?: string; message?: string };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 422 });
    }

    // 2. Role permission validation
    if (type === "EVIDENCE_REQUEST" || type === "EVIDENCE_REQUESTED") {
      if (!participantCtx.isRequester && !participantCtx.isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Only mission requesters can request additional evidence" },
          { status: 403 },
        );
      }
    }

    const eventType =
      type === "EVIDENCE_REQUEST" || type === "EVIDENCE_REQUESTED"
        ? "EVIDENCE_REQUESTED"
        : "MESSAGE_SENT";

    const entry = await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType,
        summary: message.trim(),
        actorId: participantCtx.userId,
        metadata: {
          role: participantCtx.participantRole,
        },
      },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
