import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

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

  const rec = await prisma.optimizationRecommendation.update({
    where: { id: params.recommendationId },
    data: { status: "REJECTED" },
  });
  return NextResponse.json({ success: true, recommendation: rec });
}
