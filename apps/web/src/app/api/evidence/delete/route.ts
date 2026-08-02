import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-helpers";
import { apiError } from "@/lib/error-mapper";
import { LocalStorageProvider } from "@scoutx/storage";

const storageProvider = new LocalStorageProvider("./data/evidence");

export async function DELETE(request: Request) {
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
    const deleted = await storageProvider.delete(storageKey);
    if (!deleted) {
      return apiError("File not found", 404);
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
