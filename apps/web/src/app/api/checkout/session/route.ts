import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 1. Authenticate request server-side
  const principal = await authenticate(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Read body parameter (only missionId is required; client amountCents and requesterId are ignored)
    const body = (await request.json().catch(() => null)) as { missionId?: string } | null;
    const missionId = body?.missionId;

    if (!missionId || typeof missionId !== "string") {
      return NextResponse.json({ error: "missionId is required" }, { status: 400 });
    }

    // 3. Load mission from database
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // 4. Mission ownership authorization: requesterId MUST equal principal.id
    if (mission.requesterId !== principal.id) {
      return NextResponse.json(
        { error: "Forbidden: Mission belongs to another user" },
        { status: 403 },
      );
    }

    // 5. Authoritative price and currency from database mission record
    const amountCents = mission.budgetCents;
    if (typeof amountCents !== "number" || amountCents <= 0) {
      return NextResponse.json({ error: "Invalid mission budget" }, { status: 422 });
    }

    // 6. Validate mission state
    if (mission.status !== "DRAFT" && mission.status !== "OPEN") {
      return NextResponse.json({ error: "Mission is not in a payable status" }, { status: 400 });
    }

    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // Fail closed in production if STRIPE_SECRET_KEY is missing
    if (process.env.NODE_ENV === "production" && !stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe secret key is required in production" },
        { status: 500 },
      );
    }

    let sessionId: string;
    let checkoutUrl: string;

    if (stripeSecretKey) {
      // 7. Create real Stripe Checkout Session using Stripe REST API
      const params = new URLSearchParams();
      params.append("mode", "payment");
      params.append("success_url", `${origin}/investigation/${mission.id}?checkout=success`);
      params.append("cancel_url", `${origin}/investigation/${mission.id}?checkout=cancel`);
      params.append("line_items[0][price_data][currency]", "usd");
      params.append("line_items[0][price_data][unit_amount]", amountCents.toString());
      params.append(
        "line_items[0][price_data][product_data][name]",
        `Escrow Funding: ${mission.title}`,
      );
      params.append("line_items[0][quantity]", "1");
      params.append("metadata[missionId]", mission.id);
      params.append("metadata[requesterId]", principal.id);

      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = (await response.json()) as {
        id?: string;
        url?: string;
        error?: { message: string };
      };
      if (!response.ok || !data.id || !data.url) {
        throw new Error(data.error?.message || "Stripe session creation failed");
      }

      sessionId = data.id;
      checkoutUrl = data.url;
    } else {
      // Development mock boundary when STRIPE_SECRET_KEY is absent in dev mode
      sessionId = `cs_dev_mock_${Date.now()}`;
      checkoutUrl = `${origin}/investigation/${mission.id}?checkout=success&amount=${amountCents}`;
    }

    // NOTE: Zero coin credit occurs here. Coin credit MUST remain webhook-driven upon checkout.session.completed.
    return NextResponse.json({
      sessionId,
      url: checkoutUrl,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Checkout session error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
