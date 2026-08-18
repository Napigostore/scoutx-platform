import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ClaimMissionUseCase } from "@scoutx/application";
import { AuthorizationError } from "@scoutx/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getClaimMissionUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new ClaimMissionUseCase(missionRepo);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    principal.id,
  );
  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;

  if (!user && principal.email) {
    user = await prisma.user.findUnique({ where: { email: principal.email } });
  }

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const claimMissionUseCase = getClaimMissionUseCase();
    const mission = await claimMissionUseCase.execute(missionId, user.id, "SCOUT");
    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to claim mission";
    if (error instanceof AuthorizationError || message.includes("cannot claim")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Mission was already claimed by another scout") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
