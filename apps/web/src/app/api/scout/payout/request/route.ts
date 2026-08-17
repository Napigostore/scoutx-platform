import { NextResponse } from "next/server";
import { PrismaCoinRepository } from "@scoutx/infrastructure";
import { SimpleTokenVerifier, requireEnv } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";
import { prisma } from "@/lib/prisma";

const tokenVerifier = new SimpleTokenVerifier(requireEnv("JWT_SECRET"));
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
const coinRepo = new PrismaCoinRepository();

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
  // 1. Authenticate request
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Require SCOUT role
  if (principal.role !== "SCOUT") {
    return NextResponse.json(
      { error: "Forbidden: only scouts can request payouts" },
      { status: 403 },
    );
  }

  // 3. Read body
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { amountCents, idempotencyKey } = body as Record<string, unknown>;

  // 4. Validate input
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "amountCents must be a positive integer" }, { status: 400 });
  }

  if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
    return NextResponse.json(
      { error: "idempotencyKey must be a non-empty string" },
      { status: 400 },
    );
  }

  // 5. Server-side ownership: always derive userId from authenticated principal
  const userId = principal.id;

  // 6. Check Stripe Connect payout eligibility server-side
  const scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId },
  });

  if (!scoutProfile || scoutProfile.stripeConnectStatus !== "ACTIVE") {
    return NextResponse.json(
      { error: "Stripe Connect account is not ready for payouts" },
      { status: 409 },
    );
  }

  try {
    // 7. Execute atomic balance reservation
    const withdrawalRequest = await coinRepo.requestWithdrawalAtomically(
      userId,
      amountCents,
      idempotencyKey.trim(),
    );

    return NextResponse.json(withdrawalRequest, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request withdrawal";

    if (message.includes("Insufficient available balance")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
