import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { apiError } from "@/lib/error-mapper";
import { InMemoryEventBus } from "@scoutx/events";
import { LocalStorageProvider, UploadService, createStorageProvider } from "@scoutx/storage";
import { EvidenceFileValidator } from "@scoutx/application";
import { prisma } from "@/lib/prisma";
import path from "node:path";
import { notifyEvidenceUploaded } from "@/lib/notification-service";

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const missionId = formData.get("missionId") as string | null;

    if (!file || !missionId) {
      return apiError("file and missionId are required", 422);
    }

    // 1. Mission Participant Authorization Check (Requester or Assigned Scout)
    const participantCtx = await getMissionParticipantContext(request, missionId);
    if (!participantCtx || "error" in participantCtx) {
      const errorMsg =
        (participantCtx && "error" in participantCtx && participantCtx.error) || "Unauthorized";
      const errorStatus =
        (participantCtx && "status" in participantCtx && participantCtx.status) || 401;
      return apiError(errorMsg, errorStatus);
    }

    // Locked if mission is already approved/completed by requester
    const lockedStatuses = [
      "COMPLETED",
      "REWARDED",
      "COMPLETED_PENDING_SETTLEMENT",
      "SETTLEMENT_PENDING",
      "VOTING_FINALIZED",
    ];
    if (lockedStatuses.includes(participantCtx.mission.status)) {
      return apiError("Mission is already completed/approved. New evidence is locked.", 409);
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

    // 4. Execute secure upload to R2 / Storage Provider
    const result = await uploadService.upload(buffer, {
      fileName: sanitizedFileName,
      mimeType,
      bytes: buffer.length,
      missionId,
      scoutId: participantCtx.userId,
    });

    let downloadUrl = "";
    try {
      downloadUrl = await uploadService.getDownloadUrl(result.storageKey);
    } catch {
      downloadUrl = `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`;
    }

    const finalUrl =
      downloadUrl || `/api/evidence/download?key=${encodeURIComponent(result.storageKey)}`;

    // 5. Record Evidence and TimelineEntry in Database
    try {
      const isVideo = mimeType.startsWith("video/");
      const evidenceType = isVideo ? "VIDEO" : "PHOTO";

      // If assigned scout exists or user is scout, find profile; otherwise fallback to mission assignedScoutId
      let scoutProfileId =
        participantCtx.scoutProfile?.id || participantCtx.mission.assignedScoutId;

      if (!scoutProfileId) {
        const anyScout = await prisma.scoutProfile.findFirst({ select: { id: true } });
        if (anyScout) scoutProfileId = anyScout.id;
      }

      if (scoutProfileId) {
        await prisma.evidence.create({
          data: {
            missionId,
            scoutId: scoutProfileId,
            userId: participantCtx.userId,
            caption: sanitizedFileName,
            type: evidenceType,
            mediaUrl: finalUrl,
          },
        });
        // Notify requester about new evidence
        await notifyEvidenceUploaded(missionId, participantCtx.userId).catch(() => {});
      }

      await prisma.timelineEntry.create({
        data: {
          missionId,
          eventType: "EVIDENCE_UPLOADED",
          summary: `${participantCtx.participantRole === "REQUESTER" ? "Requester" : "Scout"} uploaded ${isVideo ? "video" : "photo"} evidence: ${sanitizedFileName}`,
          actorId: participantCtx.userId,
          metadata: {
            url: finalUrl,
            storageKey: result.storageKey,
            mimeType,
            role: participantCtx.participantRole,
          },
        },
      });
    } catch (dbErr) {
      console.error("Error recording evidence/timeline in DB:", dbErr);
    }

    return NextResponse.json(
      {
        evidenceId: result.evidenceId,
        storageKey: result.storageKey,
        url: finalUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
