import { NextResponse } from "next/server";
import { SimpleTokenVerifier, requireEnv } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Access token is missing" }, { status: 401 });
    }

    const tokenVerifier = new SimpleTokenVerifier(requireEnv("JWT_SECRET"));
    const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
    const principal = await getCurrentUserUseCase.execute(token);
    return NextResponse.json({ principal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
