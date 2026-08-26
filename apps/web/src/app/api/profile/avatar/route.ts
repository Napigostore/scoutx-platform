import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { apiError } from "@/lib/error-mapper";
import { InMemoryEventBus } from "@scoutx/events";
import { LocalStorageProvider, UploadService, createStorageProvider } from "@scoutx/storage";
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
  try {
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      return apiError("Unauthorized", 401);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }

    if (!user) {
      return apiError("User not found", 404);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("Image file is required", 422);
    }

    const mimeType = file.type || "";
    if (!mimeType.startsWith("image/")) {
      return apiError("Only image files are allowed for avatar upload", 422);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) {
      return apiError("Avatar image must not exceed 5MB", 422);
    }

    const sanitizedFileName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");

    const result = await uploadService.upload(buffer, {
      fileName: `avatar_${sanitizedFileName}`,
      mimeType,
      bytes: buffer.length,
      missionId: "user-avatars",
      scoutId: user.id,
    });

    const finalAvatarUrl = `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: finalAvatarUrl },
    });

    return NextResponse.json(
      {
        success: true,
        avatarUrl: finalAvatarUrl,
        storageKey: result.storageKey,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Avatar upload failed";
    return apiError(message, 500);
  }
}
