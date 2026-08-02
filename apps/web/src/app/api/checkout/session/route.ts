import { NextResponse } from "next/server";
import { PrismaMissionRepository, PrismaCoinRepository, AuditLogger } from "@scoutx/infrastructure";

const missionRepo = new PrismaMissionRepository();
const coinRepo = new PrismaCoinRepository();
const auditLogger = new AuditLogger();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      missionId: string;
      amountCents: number;
      requesterId: string;
    };
    const { missionId, amountCents, requesterId } = body;

    if (!missionId || !amountCents || !requesterId) {
      return NextResponse.json({ error: "Missing required checkout parameters" }, { status: 400 });
    }

    const mission = await missionRepo.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Lock Escrow Deposit in Database via PrismaCoinRepository.create
    await coinRepo.create({
      id: `tx_stripe_${Date.now()}`,
      userId: requesterId,
      missionId,
      amountCents: -amountCents,
      currency: "COIN",
      reason: `Escrow Lock for Mission ${missionId}`,
      eventType: "Escrow Deposit",
    });

    auditLogger.log("coin_change", requesterId, {
      action: "stripe_escrow_deposit",
      missionId,
      amountCents,
    });

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const mockStripeCheckoutUrl = `${origin}/investigation/${missionId}?checkout=success&amount=${amountCents}`;

    return NextResponse.json({
      sessionId: `cs_stripe_${Date.now()}`,
      url: mockStripeCheckoutUrl,
      status: "success",
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Checkout error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
