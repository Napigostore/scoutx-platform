import { NextResponse } from "next/server";
import { PrismaIdentityRepository } from "@scoutx/infrastructure";
import { SimplePasswordHasher, SimpleTokenVerifier } from "@scoutx/auth";
import { SignInUseCase } from "@scoutx/application";

const identityRepo = new PrismaIdentityRepository();
const passwordHasher = new SimplePasswordHasher();
const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const signInUseCase = new SignInUseCase(identityRepo, passwordHasher, tokenVerifier);

// Seed a mock user for testing
identityRepo.saveUser({
  id: "user-1",
  email: "user@test.com",
  passwordHash: "hashed:password123",
  role: "user",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await signInUseCase.execute(email, password);

    const response = NextResponse.json({ accessToken: result.accessToken });
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600, // 7 days
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
