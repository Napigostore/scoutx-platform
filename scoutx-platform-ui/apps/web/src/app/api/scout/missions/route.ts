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

  try {
    const listAvailableMissionsUseCase = getListAvailableMissionsUseCase();
    const missions = await listAvailableMissionsUseCase.execute("SCOUT", user.id);
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list available missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
