import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
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
    select: { requesterId: true },
  });
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: principal.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && mission.requesterId !== principal.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const recommendations = await prisma.researchRecommendation.findMany({
    where: {
      missionId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ recommendations });
}
