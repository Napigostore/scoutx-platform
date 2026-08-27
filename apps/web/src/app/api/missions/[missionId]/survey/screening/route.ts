import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { processSurveyScreening } from "@/lib/survey-service";

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
  };

  try {
    const result = await processSurveyScreening(missionId, ctx.userId, body.answers || {});
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Screening failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
