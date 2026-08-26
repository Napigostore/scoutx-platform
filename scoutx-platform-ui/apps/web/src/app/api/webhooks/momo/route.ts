import { NextResponse } from "next/server";
import createCrypto from "node:crypto";
import { MoMoPaymentProvider } from "@scoutx/application";
import { PrismaCoinRepository } from "@scoutx/infrastructure";
import { prisma } from "@/lib/prisma";

const coinRepo = new PrismaCoinRepository();

function generateDeterministicUuid(seed: string): string {
  const hash = createCrypto.createHash("sha256").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. Verify HMAC SHA256 Signature
    const momoProvider = new MoMoPaymentProvider();
    const isValidSignature = momoProvider.verifyIpnSignature(payload);

    if (!isValidSignature) {
      console.warn("MoMo Webhook: Invalid HMAC SHA256 signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Check MoMo resultCode (0 indicates success)
    const resultCode = Number(payload.resultCode ?? -1);
    if (resultCode !== 0) {
      console.log(`MoMo Webhook: Non-zero resultCode (${resultCode}) for order ${payload.orderId}`);
      // Acknowledge receipt to MoMo without creating ledger entry
      return NextResponse.json({
        resultCode: 0,
        message: "Notification acknowledged (payment non-successful)",
      });
    }

    // 3. Extract metadata from extraData or orderId
    const extraDataStr = String(payload.extraData ?? "");
    const params = new URLSearchParams(extraDataStr);
    let missionId: string | null = params.get("missionId");
    let requesterId: string | null = params.get("requesterId");

    // Fallback: parse missionId from orderId (ord_{missionId}_{timestamp})
    if (!missionId && typeof payload.orderId === "string" && payload.orderId.startsWith("ord_")) {
      const parts = payload.orderId.split("_");
      if (parts.length >= 2 && parts[1]) {
        missionId = parts[1];
      }
    }

    if (!missionId) {
      console.error("MoMo Webhook: Missing missionId in payload");
      return NextResponse.json({ error: "Missing missionId" }, { status: 400 });
    }

    // 4. Load Mission from database
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      console.error(`MoMo Webhook: Mission ${missionId} not found`);
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Fallback requesterId if missing in extraData
    if (!requesterId) {
      requesterId = mission.requesterId;
    }

    // 5. Currency Verification
    const cleanCurrency = mission.currency.trim().toUpperCase();
    if (cleanCurrency !== "VND") {
      console.error(`MoMo Webhook: Invalid currency ${cleanCurrency} for mission ${missionId}`);
      return NextResponse.json({ error: "Currency mismatch" }, { status: 400 });
    }

    // 6. Financial Amount Verification (MoMo amount must match Mission budget)
    const ipnAmount = Number(payload.amount ?? 0);
    if (ipnAmount !== mission.budgetCents) {
      console.error(
        `SECURITY WARNING: MoMo Webhook amount mismatch! Payload: ${ipnAmount} VND, Authoritative Mission Budget: ${mission.budgetCents} VND`,
      );
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }

    // 7. Idempotency Protection (Deterministic UUID from MoMo requestId/orderId)
    const requestId = String(payload.requestId ?? payload.orderId ?? createCrypto.randomUUID());
    const transactionId = generateDeterministicUuid(`momo_${requestId}`);

    const existingTx = await coinRepo.findById(transactionId);
    if (existingTx) {
      console.log(`MoMo Webhook: Idempotent duplicate event ${transactionId} ignored`);
      return NextResponse.json({ resultCode: 0, message: "Duplicate acknowledged" });
    }

    // 8. Create Escrow Ledger Transaction & update Mission status
    await prisma.$transaction(async (tx) => {
      await tx.coinTransaction.create({
        data: {
          id: transactionId,
          userId: requesterId as string,
          amountCents: -mission.budgetCents,
          currency: "VND",
          reason: `MoMo Escrow Payment for Mission ${missionId}`,
          description: `MoMo IPN transaction ${payload.transId ?? payload.orderId}`,
          eventType: "Escrow Deposit",
          missionId: mission.id,
        },
      });

      if (mission.status === "DRAFT") {
        await tx.mission.update({
          where: { id: mission.id },
          data: { status: "OPEN" },
        });
      }
    });

    console.log(
      `MoMo Webhook: Successfully processed Escrow Deposit of ${mission.budgetCents} VND for Mission ${missionId}`,
    );

    // 9. Acknowledge success to MoMo
    return NextResponse.json({ resultCode: 0, message: "Success" });
  } catch (error) {
    console.error("MoMo Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
