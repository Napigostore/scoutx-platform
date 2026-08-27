import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { generateResearchPlan } from "@/lib/ai-research-copilot-service";

export async function POST(request: Request, { params }: { params: Promise<{ briefId: string }> }) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { briefId } = await params;
  try {
    const result = await generateResearchPlan(briefId, principal.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Regeneration failed" },
      { status: 400 },
    );
  }
}
