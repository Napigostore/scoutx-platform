import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-helpers";
import { apiError } from "@/lib/error-mapper";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const storageKey = searchParams.get("key");

  if (!storageKey) {
    return apiError("key query parameter required", 422);
  }

  try {
    const buffer = await readFile(join("./data/evidence", storageKey));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(storageKey)}"`,
      },
    });
  } catch {
    return apiError("File not found", 404);
  }
}
