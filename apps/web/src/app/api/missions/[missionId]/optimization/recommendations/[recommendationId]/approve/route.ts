/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { executeRecommendation } from "@/lib/research-optimization-service";

export async function POST(
  request: Request,
  props: { params: Promise<{ missionId: string; recommendationId: string }> },
) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (ctx.userId !== ctx.mission.requesterId && ctx.userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rec = await executeRecommendation(params.recommendationId, ctx.userId);
    return NextResponse.json({ success: true, recommendation: rec });
  } catch (err: any) {
    if (err.message?.includes("Invalid state")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
