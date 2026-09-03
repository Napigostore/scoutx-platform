import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getFieldworkQuotas } from "@/lib/fieldwork-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { missionId } = await params;
  try {
    const quotas = await getFieldworkQuotas(missionId);
    return NextResponse.json({ quotas });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 },
    );
  }
}
