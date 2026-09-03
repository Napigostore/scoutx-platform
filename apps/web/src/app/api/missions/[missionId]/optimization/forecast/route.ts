import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import {
  calculateOptimizationScore,
  getOptimizationMetrics,
} from "@/lib/research-optimization-service";

export async function GET(request: Request, props: { params: Promise<{ missionId: string }> }) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (ctx.userId !== ctx.mission.requesterId && ctx.userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metrics = await getOptimizationMetrics(params.missionId);
  const result = await calculateOptimizationScore(metrics);

  return NextResponse.json(result);
}
