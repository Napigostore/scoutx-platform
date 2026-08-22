import { NextResponse } from "next/server";
import { getAuthenticatedScoutContext } from "@/lib/server-auth";
import { apiError } from "@/lib/error-mapper";
import { InMemoryEventBus } from "@scoutx/events";
import { LocalStorageProvider, UploadService, createStorageProvider } from "@scoutx/storage";
import { EvidenceFileValidator } from "@scoutx/application";
import { prisma } from "@/lib/prisma";
import path from "node:path";

function getStorageProvider() {
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
    return createStorageProvider("cloudflare-r2", {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      publicUrlBase: process.env.R2_PUBLIC_URL_BASE,
    });
  }
  return new LocalStorageProvider("./data/evidence");
}

const storageProvider = getStorageProvider();
const eventBus = new InMemoryEventBus();
const uploadService = new UploadService({ storageProvider, eventBus });

export async function POST(request: Request) {
  // 1. Authentication & Scout Authorization check
  const scoutCtx = await getAuthenticatedScoutContext(request);
  if (!scoutCtx || "error" in scoutCtx) {
    const errorMsg = (scoutCtx && "error" in scoutCtx && scoutCtx.error) || "Unauthorized";
    const errorStatus = (scoutCtx && "status" in scoutCtx && scoutCtx.status) || 401;
    return apiError(errorMsg, errorStatus);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const missionId = formData.get("missionId") as string | null;

    if (!file || !missionId) {
      return apiError("file and missionId are required", 422);
    }

    // 2. Mission ownership & assignment check
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { id: true, assignedScoutId: true, status: true },
    });

    if (!mission) {
      return apiError("Mission not found", 404);
    }

    if (
      scoutCtx.scoutProfile &&
      mission.assignedScoutId &&
      mission.assignedScoutId !== scoutCtx.scoutProfile.id
    ) {
      return apiError("Forbidden: Mission is assigned to another scout", 403);
    }

    // 4. File sanitization & path traversal prevention
    const sanitizedFileName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");

    // 5. File type and size validation
    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      EvidenceFileValidator.validate(sanitizedFileName, mimeType, buffer.length);
    } catch (valErr) {
      const message = valErr instanceof Error ? valErr.message : "Invalid evidence file";
      return apiError(message, 422);
    }

    // 6. Execute secure upload
    const result = await uploadService.upload(buffer, {
      fileName: sanitizedFileName,
      mimeType,
      bytes: buffer.length,
      missionId,
      scoutId: scoutCtx.userId,
    });

    let downloadUrl = "";
    try {
      downloadUrl = await uploadService.getDownloadUrl(result.storageKey);
    } catch {
      downloadUrl = `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`;
    }

    return NextResponse.json(
      {
        evidenceId: result.evidenceId,
        storageKey: result.storageKey,
        url: downloadUrl || `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
