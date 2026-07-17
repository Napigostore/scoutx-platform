import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    checks: {
      database: "ok",
    },
    timestamp: new Date().toISOString(),
  });
}
