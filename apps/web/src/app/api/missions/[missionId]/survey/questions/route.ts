import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { createSurveyQuestion, getSurveyQuestions } from "@/lib/survey-p3-service";

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
      { error: "Forbidden: Only requesters can edit survey questions" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  try {
    const question = await createSurveyQuestion(missionId, body);
    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create question";
    const status = message.includes("SURVEY_LOCKED") ? 409 : 400;
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

  try {
    const questions = await getSurveyQuestions(missionId);
    return NextResponse.json({ questions }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
