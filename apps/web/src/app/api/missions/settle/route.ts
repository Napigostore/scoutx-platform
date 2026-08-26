import { NextResponse } from "next/server";
import { checkAndSettleMissions } from "@/lib/dispute-settlement-service";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const report = await checkAndSettleMissions();
    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Settlement check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
