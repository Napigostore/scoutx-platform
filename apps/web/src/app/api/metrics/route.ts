import { NextResponse } from "next/server";
import { globalMetrics } from "@scoutx/observability";

export async function GET() {
  return NextResponse.json(globalMetrics.getMetricsSnapshot());
}
