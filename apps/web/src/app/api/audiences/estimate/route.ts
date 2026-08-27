import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { estimateAudienceSize } from "@/lib/audience-panel-service";

export async function POST(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.criteria) {
    return NextResponse.json({ error: "criteria is required" }, { status: 400 });
  }

  try {
    const estimatedCount = await estimateAudienceSize(body.criteria);
    return NextResponse.json({ estimatedCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to estimate audience";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
