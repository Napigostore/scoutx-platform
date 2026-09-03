import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { completeFieldwork } from "@/lib/fieldwork-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: principal.id }, ...(principal.email ? [{ email: principal.email }] : [])] },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== "REQUESTER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;
  try {
    await completeFieldwork(missionId, user.id);
    return NextResponse.json({ success: true, status: "COMPLETED" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
