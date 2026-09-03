import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import {
  generateRecommendations,
  getOptimizationMetrics,
  markStaleRecommendations,
} from "@/lib/research-optimization-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, props: { params: Promise<{ missionId: string }> }) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (ctx.userId !== ctx.mission.requesterId && ctx.userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metrics = await getOptimizationMetrics(params.missionId);
  await markStaleRecommendations(params.missionId);
  const newRecs = await generateRecommendations(params.missionId, metrics);
  const created = await Promise.all(
    newRecs.map((rec) => prisma.optimizationRecommendation.create({ data: rec })),
  );

  return NextResponse.json({ success: true, recommendations: created });
}
