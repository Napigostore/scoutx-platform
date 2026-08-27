import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import {
  getSavedAudiences,
  saveSavedAudience,
  estimateAudienceSize,
} from "@/lib/audience-panel-service";

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const audiences = await getSavedAudiences(principal.id);
  return NextResponse.json({ audiences });
}

export async function POST(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.criteria) {
    return NextResponse.json({ error: "name and criteria are required" }, { status: 400 });
  }

  try {
    const audience = await saveSavedAudience(principal.id, {
      name: body.name,
      description: body.description,
      criteria: body.criteria,
    });
    return NextResponse.json({ success: true, audience }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save audience";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
