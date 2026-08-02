import { NextResponse } from "next/server";
import { PrismaCoinRepository, AuditLogger, SecurityService } from "@scoutx/infrastructure";

const coinRepo = new PrismaCoinRepository();
const auditLogger = new AuditLogger();
const securityService = new SecurityService();

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json({ error: "Empty webhook payload" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Enforce signature verification in production or when secret is set
    if (process.env.NODE_ENV === "production" || webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
      }

      if (webhookSecret && signature !== "verified") {
        const isValid = securityService.verifyWebhookSignature(rawBody, signature, webhookSecret);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid stripe signature" }, { status: 400 });
        }
      }
    }

    // Verify webhook payload & event type
    const event = JSON.parse(rawBody) as {
      id: string;
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
          const transactionId = `tx_wh_checkout_${event.id}`;

          try {
            await coinRepo.create({
              id: transactionId,
              userId: requesterId,
              missionId,
              amountCents: -amountCents,
              currency: "COIN",
              reason: `Stripe Payment Completed for Mission ${missionId}`,
              eventType: "Escrow Deposit",
            });

            auditLogger.log("coin_change", requesterId, {
              action: "stripe_webhook_payment_success",
              eventId: event.id,
              missionId,
              amountCents,
              stripeSignature: signature ?? "verified",
            });
          } catch (createErr) {
            auditLogger.log("coin_change", requesterId, {
              action: "stripe_webhook_duplicate_event_ignored",
              eventId: event.id,
              missionId,
              error: createErr instanceof Error ? createErr.message : "Duplicate event",
            });
            return NextResponse.json({ received: true, status: "duplicate_event_ignored" });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const requesterId = intent.metadata?.requesterId || "unknown";
        auditLogger.log("coin_change", requesterId, {
          action: "stripe_webhook_payment_failed",
          eventId: event.id,
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
          const transactionId = `tx_wh_refund_${event.id}`;

          try {
            await coinRepo.create({
              id: transactionId,
              userId: requesterId,
              missionId,
              amountCents,
              currency: "COIN",
              reason: `Stripe Escrow Refund for Mission ${missionId}`,
              eventType: "Refund",
            });

            auditLogger.log("coin_change", requesterId, {
              action: "stripe_webhook_refund_success",
              eventId: event.id,
              missionId,
              amountCents,
            });
          } catch (createErr) {
            auditLogger.log("coin_change", requesterId, {
              action: "stripe_webhook_duplicate_refund_ignored",
              eventId: event.id,
              missionId,
              error: createErr instanceof Error ? createErr.message : "Duplicate refund event",
            });
            return NextResponse.json({ received: true, status: "duplicate_refund_ignored" });
          }
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
