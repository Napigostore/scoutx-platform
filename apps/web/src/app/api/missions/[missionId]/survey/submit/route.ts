import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { submitSurveyAnswers } from "@/lib/survey-p3-service";

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

  const body = (await request.json().catch(() => ({}))) as {
    answers?: Record<string, unknown>;
    durationSeconds?: number;
    completionCode?: string;
  };

  try {
    const result = await submitSurveyAnswers({
      missionId,
      workerUserId: ctx.userId,
      answers: body.answers || {},
      durationSeconds: body.durationSeconds || 0,
      completionCode: body.completionCode,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Survey submit failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
