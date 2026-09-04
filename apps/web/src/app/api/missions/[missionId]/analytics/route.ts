/* eslint-disable */
import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { getMissionAnalytics } from "@/lib/research-analytics-service";

export async function GET(request: Request, props: { params: Promise<{ missionId: string }> }) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);

  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (!ctx.isRequester && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Requester access required" }, { status: 403 });
  }

  try {
    const analytics = await getMissionAnalytics(params.missionId);
    return NextResponse.json({ analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
