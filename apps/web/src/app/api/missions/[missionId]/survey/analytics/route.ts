import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { getSurveyAnalytics } from "@/lib/survey-p3-service";

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

  if (ctx.participantRole !== "REQUESTER" && ctx.participantRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only requesters can view analytics" },
      { status: 403 },
    );
  }

  try {
    const analytics = await getSurveyAnalytics(missionId);
    return NextResponse.json(analytics, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analytics failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
