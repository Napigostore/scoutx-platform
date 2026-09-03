import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ missionId: string }> }) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (ctx.userId !== ctx.mission.requesterId && ctx.userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recommendations = await prisma.optimizationRecommendation.findMany({
    where: { missionId: params.missionId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recommendations);
}
