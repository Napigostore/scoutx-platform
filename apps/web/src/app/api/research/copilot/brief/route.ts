import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { createResearchBrief, listResearchBriefs } from "@/lib/ai-research-copilot-service";

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const briefs = await listResearchBriefs(principal.id);
  return NextResponse.json({ briefs });
}

export async function POST(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.rawBrief || typeof body.rawBrief !== "string" || body.rawBrief.trim().length < 10) {
    return NextResponse.json({ error: "rawBrief must be at least 10 characters" }, { status: 400 });
  }

  try {
    const brief = await createResearchBrief(principal.id, body);
    return NextResponse.json({ success: true, brief }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create brief";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
