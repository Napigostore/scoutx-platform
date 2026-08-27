import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { selectSurveyParticipant, getSurveyStats } from "@/lib/survey-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
  const ctx = await getMissionParticipantContext(request, missionId);
  if (!ctx || "error" in ctx) {
    return NextResponse.json(
      { error: (ctx as { error: string }).error ?? "Unauthorized" },
      { status: (ctx as { status: number }).status ?? 401 },
    );
  }

  if (ctx.participantRole !== "REQUESTER" && ctx.participantRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only the requester can select survey participants" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    participantUserId?: string;
    action?: "SELECT" | "REJECT";
  };

  const { participantUserId, action } = body;
  if (!participantUserId || !action || (action !== "SELECT" && action !== "REJECT")) {
    return NextResponse.json(
      { error: "participantUserId and action (SELECT | REJECT) are required" },
      { status: 400 },
    );
  }

  try {
    const result = await selectSurveyParticipant(missionId, participantUserId, ctx.userId, action);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to select survey participant";
    const status =
      message.includes("SURVEY_FULL") || message.includes("INSUFFICIENT_BUDGET") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
  const ctx = await getMissionParticipantContext(request, missionId);
  if (!ctx || "error" in ctx) {
    return NextResponse.json(
      { error: (ctx as { error: string }).error ?? "Unauthorized" },
      { status: (ctx as { status: number }).status ?? 401 },
    );
  }

  const isRequester = ctx.participantRole === "REQUESTER" || ctx.participantRole === "ADMIN";

  const stats = await getSurveyStats(missionId);

  // Requesters see all participants; workers see only their own record
  const participantsWhere = isRequester ? { missionId } : { missionId, userId: ctx.userId };

  const participants = await prisma.surveyParticipant.findMany({
    where: participantsWhere,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    stats,
    participants,
  });
}
