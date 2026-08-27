import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getWorkerTrustProfile } from "@/lib/worker-trust-service";
import { evaluateWorkerRisk } from "@/lib/worker-risk-service";

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getWorkerTrustProfile(principal.id);
    const risk = await evaluateWorkerRisk(principal.id);

    return NextResponse.json(
      {
        trustProfile: profile,
        riskLevel: risk.riskLevel,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch trust profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
