import { NextResponse } from "next/server";
import { PrismaIdentityRepository } from "@scoutx/infrastructure";
import { SignOutUseCase } from "@scoutx/application";

const identityRepo = new PrismaIdentityRepository();
const signOutUseCase = new SignOutUseCase(identityRepo);

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshToken = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("refreshToken="))
      ?.split("=")[1];

    if (refreshToken) {
      await signOutUseCase.execute(refreshToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("refreshToken");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign out failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
