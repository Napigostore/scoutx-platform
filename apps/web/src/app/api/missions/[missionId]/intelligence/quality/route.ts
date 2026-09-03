/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import {
  computeResearchMetrics,
  calculateResearchHealthScore,
} from "@/lib/research-intelligence-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { missionId } = await params;
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { requesterId: true, quotas: true },
  });
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: principal.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && mission.requesterId !== principal.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const metrics = await computeResearchMetrics(missionId);
    const quotas = (mission.quotas as any[] | null) ?? [];
    const healthScore = calculateResearchHealthScore(
      metrics,
      quotas.map((q) => ({ target: q.target, filled: 0 })),
      0,
    );
    return NextResponse.json({ metrics, healthScore });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
