import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { approveRecommendation } from "@/lib/research-intelligence-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string; id: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const confirmDangerous = Boolean(body.confirmDangerous);

  try {
    const result = await approveRecommendation(id, principal.id, confirmDangerous);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("Forbidden")
      ? 403
      : msg.includes("not found")
        ? 404
        : msg.includes("DANGEROUS_ACTION")
          ? 400
          : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
