import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getPanelStats } from "@/lib/audience-panel-service";

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getPanelStats(principal.id);
  return NextResponse.json(stats);
}
