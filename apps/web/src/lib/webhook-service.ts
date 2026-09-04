import crypto from "node:crypto";
import { prisma } from "./prisma";

export async function createWebhookSubscription({
  userId,
  url,
  events = ["MISSION_COMPLETED", "EVIDENCE_UPLOADED", "QUOTA_REACHED"],
}: {
  userId: string;
  url: string;
  events?: string[];
}) {
  const secret = `whsec_${crypto.randomBytes(20).toString("hex")}`;

  const subscription = await prisma.webhookSubscription.create({
    data: {
      userId,
      url,
      secret,
      events,
    },
  });

  return subscription;
}

export async function dispatchWebhookEvent(userId: string, event: string, payload: unknown) {
  try {
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        userId,
        active: true,
        events: { has: event },
      },
    });

    if (subscriptions.length === 0) return;

    const timestamp = Date.now().toString();
    const bodyString = JSON.stringify({
      id: `evt_${crypto.randomUUID()}`,
      event,
      timestamp,
      data: payload,
    });

    for (const sub of subscriptions) {
      const hmac = crypto
        .createHmac("sha256", sub.secret)
        .update(`${timestamp}.${bodyString}`)
        .digest("hex");

      const signatureHeader = `t=${timestamp},v1=${hmac}`;

      // Asynchronous dispatch (fire & forget to avoid blocking main flow)
      fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Fiwokan-Signature": signatureHeader,
          "User-Agent": "Fiwokan-Webhook/1.0",
        },
        body: bodyString,
      }).catch((err) => {
        console.warn(`[WEBHOOK_DISPATCH_ERROR] Failed to send webhook to ${sub.url}:`, err);
      });
    }
  } catch (err) {
    console.warn("[WEBHOOK_DISPATCH_FATAL]", err);
  }
}
