import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { ListAvailableMissionsUseCase } from "@scoutx/application";
import { SimpleTokenVerifier } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";

const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
const missionRepo = new PrismaMissionRepository();
const listAvailableMissionsUseCase = new ListAvailableMissionsUseCase(missionRepo);

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

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (principal.role !== "SCOUT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const missions = await listAvailableMissionsUseCase.execute("SCOUT");
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list available missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
