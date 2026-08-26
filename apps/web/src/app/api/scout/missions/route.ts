import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ListAvailableMissionsUseCase } from "@scoutx/application";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getListAvailableMissionsUseCase() {
  const missionRepo = new PrismaMissionRepository();
  return new ListAvailableMissionsUseCase(missionRepo);
}

export async function GET(request: Request) {
  let userId: string | undefined = undefined;

  const principal = await getAuthenticatedPrincipal(request);
  if (principal) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      principal.id,
    );
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }
    if (user) {
      userId = user.id;
    }
  }

  try {
    const listAvailableMissionsUseCase = getListAvailableMissionsUseCase();
    const missions = await listAvailableMissionsUseCase.execute("SCOUT", userId);
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list available missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
