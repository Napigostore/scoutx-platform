import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { exportSurveyData } from "@/lib/survey-p3-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;
  const ctx = await getMissionParticipantContext(request, missionId);
  if (!ctx || "error" in ctx) {
    return NextResponse.json(
      { error: (ctx as { error: string }).error ?? "Unauthorized" },
      { status: (ctx as { status: number }).status ?? 401 },
    );
  }

  if (ctx.participantRole !== "REQUESTER" && ctx.participantRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only requesters can export survey data" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "csv") as "csv" | "json";

  try {
    const data = await exportSurveyData(missionId, format);

    if (format === "csv") {
      return new NextResponse(data as string, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="survey-export-${missionId}.csv"`,
        },
      });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
