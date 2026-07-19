import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ClaimMissionUseCase } from "@scoutx/application";
import { SimpleTokenVerifier } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";

const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
const missionRepo = new PrismaMissionRepository();
const claimMissionUseCase = new ClaimMissionUseCase(missionRepo);

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (principal.role !== "SCOUT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;

  try {
    const mission = await claimMissionUseCase.execute(missionId, principal.id, "SCOUT");
    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to claim mission";
    if (message === "Mission not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Mission was already claimed by another scout") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
