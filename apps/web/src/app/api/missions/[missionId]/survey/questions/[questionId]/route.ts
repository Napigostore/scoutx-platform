import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { updateSurveyQuestion, deleteSurveyQuestion } from "@/lib/survey-p3-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ missionId: string; questionId: string }> },
) {
  const { missionId, questionId } = await params;
  const ctx = await getMissionParticipantContext(request, missionId);
  if (!ctx || "error" in ctx) {
    return NextResponse.json(
      { error: (ctx as { error: string }).error ?? "Unauthorized" },
      { status: (ctx as { status: number }).status ?? 401 },
    );
  }

  if (ctx.participantRole !== "REQUESTER" && ctx.participantRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const question = await updateSurveyQuestion(questionId, body);
    return NextResponse.json({ success: true, question });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update question";
    const status = message.includes("SURVEY_LOCKED") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ missionId: string; questionId: string }> },
) {
  const { missionId, questionId } = await params;
  const ctx = await getMissionParticipantContext(request, missionId);
  if (!ctx || "error" in ctx) {
    return NextResponse.json(
      { error: (ctx as { error: string }).error ?? "Unauthorized" },
      { status: (ctx as { status: number }).status ?? 401 },
    );
  }

  if (ctx.participantRole !== "REQUESTER" && ctx.participantRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteSurveyQuestion(questionId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete question";
    const status = message.includes("SURVEY_LOCKED") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
