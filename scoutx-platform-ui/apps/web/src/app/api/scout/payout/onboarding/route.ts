import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

export async function POST(request: Request) {
  // 1. Authenticate request
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Require SCOUT role
  if (principal.role !== "SCOUT") {
    return NextResponse.json(
      { error: "Forbidden: only scouts can request payout onboarding" },
      { status: 403 },
    );
  }

  // 3. Load ScoutProfile for principal.id
  const scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId: principal.id },
  });

  if (!scoutProfile) {
    return NextResponse.json({ error: "Scout profile not found" }, { status: 404 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const refreshUrl = `${origin}/scout/payout/onboarding?refresh=true`;
  const returnUrl = `${origin}/scout/payout/onboarding?success=true`;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  try {
    let connectAccountId = scoutProfile.stripeConnectAccountId;
    let currentStatus = scoutProfile.stripeConnectStatus || "NOT_CONNECTED";

    // 4. Create Connected Account if missing
    if (!connectAccountId) {
      if (stripeSecretKey) {
        const params = new URLSearchParams();
        params.append("type", "express");
        params.append("email", principal.email);
        params.append("capabilities[transfers][requested]", "true");
        params.append("metadata[userId]", principal.id);

        const response = await fetch("https://api.stripe.com/v1/accounts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const data = (await response.json()) as { id?: string; error?: { message: string } };
        if (!response.ok || !data.id) {
          throw new Error(data.error?.message || "Stripe account creation failed");
        }
        connectAccountId = data.id;
      } else {
        // Safe development fallback when STRIPE_SECRET_KEY is not configured
        connectAccountId = `acct_mock_${crypto.randomUUID()}`;
      }

      currentStatus = "ONBOARDING";
      await prisma.scoutProfile.update({
        where: { id: scoutProfile.id },
        data: {
          stripeConnectAccountId: connectAccountId,
          stripeConnectStatus: currentStatus,
        },
      });
    }

    // 5. Create Account Link
    let onboardingUrl = `${returnUrl}&account_id=${connectAccountId}`;
    if (stripeSecretKey) {
      const params = new URLSearchParams();
      params.append("account", connectAccountId);
      params.append("refresh_url", refreshUrl);
      params.append("return_url", returnUrl);
      params.append("type", "account_onboarding");

      const response = await fetch("https://api.stripe.com/v1/account_links", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = (await response.json()) as { url?: string; error?: { message: string } };
      if (!response.ok || !data.url) {
        throw new Error(data.error?.message || "Stripe account link creation failed");
      }
      onboardingUrl = data.url;
    }

    return NextResponse.json({
      url: onboardingUrl,
      stripeConnectAccountId: connectAccountId,
      status: currentStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate payout onboarding link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
