import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { getSurveyQuotaStats } from "@/lib/survey-service";

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
    const stats = await getSurveyQuotaStats(missionId);
    return NextResponse.json(stats, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch quota stats";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
