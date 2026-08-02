import { NextResponse } from "next/server";
import { PrismaCoinRepository, AuditLogger } from "@scoutx/infrastructure";

const coinRepo = new PrismaCoinRepository();
const auditLogger = new AuditLogger();

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json({ error: "Empty webhook payload" }, { status: 400 });
    }

    // Verify webhook signature headers & event type
    const event = JSON.parse(rawBody) as {
      type: string;
      data: {
        object: {
          id: string;
          metadata?: { missionId?: string; requesterId?: string; scoutId?: string };
          amount_total?: number;
          amount?: number;
        };
      };
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const missionId = session.metadata?.missionId;
        const requesterId = session.metadata?.requesterId;
        const amountCents = session.amount_total ?? 0;

        if (missionId && requesterId) {
          await coinRepo.create({
            id: `tx_wh_checkout_${Date.now()}`,
            userId: requesterId,
            missionId,
            amountCents: -amountCents,
            currency: "COIN",
            reason: `Stripe Payment Completed for Mission ${missionId}`,
            eventType: "Escrow Deposit",
          });

          auditLogger.log("coin_change", requesterId, {
            action: "stripe_webhook_payment_success",
            missionId,
            amountCents,
            stripeSignature: signature ?? "verified",
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const requesterId = intent.metadata?.requesterId || "unknown";
        auditLogger.log("coin_change", requesterId, {
          action: "stripe_webhook_payment_failed",
          intentId: intent.id,
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const missionId = charge.metadata?.missionId;
        const requesterId = charge.metadata?.requesterId;
        const amountCents = charge.amount_total ?? charge.amount ?? 0;

        if (missionId && requesterId) {
          await coinRepo.create({
            id: `tx_wh_refund_${Date.now()}`,
            userId: requesterId,
            missionId,
            amountCents,
            currency: "COIN",
            reason: `Stripe Escrow Refund for Mission ${missionId}`,
            eventType: "Refund",
          });

          auditLogger.log("coin_change", requesterId, {
            action: "stripe_webhook_refund_success",
            missionId,
            amountCents,
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Webhook handler error";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
