import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getAudienceProfile, upsertAudienceProfile } from "@/lib/audience-panel-service";

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getAudienceProfile(principal.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  try {
    const profile = await upsertAudienceProfile(principal.id, body);
    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update audience profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
