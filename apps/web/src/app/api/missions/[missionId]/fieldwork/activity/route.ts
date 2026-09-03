import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getFieldworkActivity } from "@/lib/fieldwork-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { missionId } = await params;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
  try {
    const events = await getFieldworkActivity(missionId, limit);
    return NextResponse.json({ events });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 },
    );
  }
}
