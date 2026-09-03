import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { submitSurvey } from "@/lib/fieldwork-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { missionId } = await params;

  const body = await request.json().catch(() => ({}));
  try {
    const result = await submitSurvey(missionId, principal.id, {
      durationSeconds: body.durationSeconds,
      qualityScore: body.qualityScore,
      completionCode: body.completionCode,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 400 },
    );
  }
}
