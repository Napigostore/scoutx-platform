import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { apiError } from "@/lib/error-mapper";
import { createAttachmentToken, verifyAttachmentToken } from "@/lib/attachment-auth";
import { InMemoryEventBus } from "@scoutx/events";
import { LocalStorageProvider, UploadService, createStorageProvider } from "@scoutx/storage";
import { EvidenceFileValidator } from "@scoutx/application";
import { prisma } from "@/lib/prisma";
import path from "node:path";
import crypto from "node:crypto";

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
    // 1. Authentication check
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      return apiError("Unauthorized", 401);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      principal.id,
    );
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }

    if (!user || (user.role !== "REQUESTER" && user.role !== "ADMIN")) {
      return apiError("Forbidden: Only requesters can upload pre-mission reference media", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("file is required", 422);
    }

    // 2. File sanitization & path traversal prevention
    const sanitizedFileName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");

    // 3. File type and size validation
    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      EvidenceFileValidator.validate(sanitizedFileName, mimeType, buffer.length);
    } catch (valErr) {
      const message = valErr instanceof Error ? valErr.message : "Invalid evidence file";
      return apiError(message, 422);
    }

    // 4. Upload file to R2 / Storage Provider
    const result = await uploadService.upload(buffer, {
      fileName: sanitizedFileName,
      mimeType,
      bytes: buffer.length,
      missionId: "pre-creation-reference",
      scoutId: user.id,
    });

    let downloadUrl = "";
    try {
      downloadUrl = await uploadService.getDownloadUrl(result.storageKey);
    } catch {
      downloadUrl = `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`;
    }

    const finalUrl =
      downloadUrl || `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`;

    const attachmentId = crypto.randomUUID();

    // 5. Persist PendingAttachment record in DB
    try {
      await prisma.pendingAttachment.create({
        data: {
          id: attachmentId,
          userId: user.id,
          storageKey: result.storageKey,
          mediaUrl: finalUrl,
          fileName: sanitizedFileName,
          mimeType,
        },
      });
    } catch (dbErr) {
      console.error("Error creating PendingAttachment DB record:", dbErr);
    }

    // 6. Generate cryptographic attachment token
    const token = createAttachmentToken({
      id: attachmentId,
      userId: user.id,
      storageKey: result.storageKey,
      url: finalUrl,
      fileName: sanitizedFileName,
      mimeType,
      createdAt: Date.now(),
    });

    return NextResponse.json(
      {
        token,
        storageKey: result.storageKey,
        url: finalUrl,
        fileName: sanitizedFileName,
        mimeType,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Temporary upload failed";
    return apiError(message, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      return apiError("Unauthorized", 401);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      principal.id,
    );
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }

    if (!user) {
      return apiError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return apiError("token parameter is required", 422);
    }

    const verified = verifyAttachmentToken(token);
    if (!verified) {
      return apiError("Forbidden: Invalid or expired attachment token", 403);
    }

    if (verified.userId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden: You cannot cancel another user's attachment", 403);
    }

    // Delete or mark PendingAttachment as consumed/cancelled
    try {
      const pending = await prisma.pendingAttachment.findUnique({
        where: { storageKey: verified.storageKey },
      });

      if (pending && !pending.consumed) {
        await prisma.pendingAttachment.update({
          where: { storageKey: verified.storageKey },
          data: { consumed: true, consumedAt: new Date() },
        });
      }
    } catch (dbErr) {
      console.error("Error marking pending attachment as cancelled:", dbErr);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancel attachment failed";
    return apiError(message, 500);
  }
}
