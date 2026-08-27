import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { deleteSavedAudience } from "@/lib/audience-panel-service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { audienceId } = await params;

  try {
    await deleteSavedAudience(audienceId, principal.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete audience";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
