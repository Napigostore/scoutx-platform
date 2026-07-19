import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { CreateMissionUseCase, ListRequesterMissionsUseCase } from "@scoutx/application";
import { SimpleTokenVerifier } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";
import { CreateMissionInputSchema } from "@scoutx/types";
import { prisma } from "@/lib/prisma";

const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
const missionRepo = new PrismaMissionRepository();
const createMissionUseCase = new CreateMissionUseCase(missionRepo);
const listRequesterMissionsUseCase = new ListRequesterMissionsUseCase(missionRepo);

async function authenticate(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  if (!token) return null;
  try {
    return await getCurrentUserUseCase.execute(token);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: principal.id } });
  if (!user || user.role !== "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CreateMissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 422 },
    );
  }

  try {
    const mission = await createMissionUseCase.execute(parsed.data, principal.id, "REQUESTER");
    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create mission";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: principal.id } });
  if (!user || user.role !== "REQUESTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const missions = await listRequesterMissionsUseCase.execute(principal.id, "REQUESTER");
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
