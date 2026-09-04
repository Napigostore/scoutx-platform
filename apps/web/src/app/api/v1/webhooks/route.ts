/* eslint-disable */
import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { createWebhookSubscription } from "@/lib/webhook-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhookSubscription.findMany({
    where: { userId: principal.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ webhooks });
}

export async function POST(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url, events } = body;

  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return NextResponse.json({ error: "Valid HTTP/HTTPS URL required" }, { status: 400 });
  }

  try {
    const subscription = await createWebhookSubscription({
      userId: principal.id,
      url,
      events: Array.isArray(events) ? events : undefined,
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
