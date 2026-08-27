import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import {
  getResearchBrief,
  patchResearchBrief,
  archiveBrief,
  generateResearchPlan,
  approveBrief,
  publishBrief,
} from "@/lib/ai-research-copilot-service";

type Params = { params: Promise<{ briefId: string }> };

export async function GET(request: Request, { params }: Params) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { briefId } = await params;
  try {
    const brief = await getResearchBrief(briefId, principal.id);
    return NextResponse.json({ brief });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { briefId } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    const brief = await patchResearchBrief(briefId, principal.id, body);
    return NextResponse.json({ success: true, brief });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { briefId } = await params;
  try {
    await archiveBrief(briefId, principal.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
