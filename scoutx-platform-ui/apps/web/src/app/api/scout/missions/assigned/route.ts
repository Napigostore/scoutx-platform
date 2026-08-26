import { NextResponse } from "next/server";
import { getAuthenticatedScoutContext } from "@/lib/server-auth";
import { fetchScoutMissionsSummary } from "@/lib/mission-summary-service";

export async function GET(request: Request) {
  const scoutCtx = await getAuthenticatedScoutContext(request);
  if ("error" in scoutCtx) {
    return NextResponse.json({ error: scoutCtx.error }, { status: scoutCtx.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const sort = (searchParams.get("sort") || "last_activity_desc") as
      "last_activity_desc" | "created_at_desc";

    const result = await fetchScoutMissionsSummary(scoutCtx.userId, {
      status,
      page,
      limit,
      sort,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assigned missions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
