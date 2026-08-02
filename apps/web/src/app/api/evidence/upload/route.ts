import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-helpers";
import { apiError } from "@/lib/error-mapper";
import { InMemoryEventBus } from "@scoutx/events";
import { LocalStorageProvider, UploadService } from "@scoutx/storage";

const storageProvider = new LocalStorageProvider("./data/evidence");
const eventBus = new InMemoryEventBus();
const uploadService = new UploadService({ storageProvider, eventBus });

export async function POST(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const missionId = formData.get("missionId") as string | null;

    if (!file || !missionId) {
      return apiError("file and missionId are required", 422);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadService.upload(buffer, {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes: buffer.length,
      missionId,
      scoutId: principal.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
