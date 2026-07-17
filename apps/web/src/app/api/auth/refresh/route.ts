import { NextResponse } from "next/server";
import { PrismaIdentityRepository } from "@scoutx/infrastructure";
import { SimpleTokenVerifier } from "@scoutx/auth";
import { RefreshSessionUseCase } from "@scoutx/application";

const identityRepo = new PrismaIdentityRepository();
const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const refreshSessionUseCase = new RefreshSessionUseCase(identityRepo, tokenVerifier);

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshToken = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("refreshToken="))
      ?.split("=")[1];

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is missing" }, { status: 401 });
    }

    const result = await refreshSessionUseCase.execute(refreshToken);

    const response = NextResponse.json({ accessToken: result.accessToken });
    response.cookies.set("refreshToken", result.newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session refresh failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
