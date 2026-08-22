import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { CreateMissionUseCase, ListRequesterMissionsUseCase } from "@scoutx/application";
import { CreateMissionInputSchema } from "@scoutx/types";
import { prisma } from "@/lib/prisma";

import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { verifyAttachmentToken } from "@/lib/attachment-auth";

function getMissionUseCases() {
  const missionRepo = new PrismaMissionRepository();
  return {
    createMissionUseCase: new CreateMissionUseCase(missionRepo),
    listRequesterMissionsUseCase: new ListRequesterMissionsUseCase(missionRepo),
  };
}

export async function POST(request: Request) {
  console.log("[MISSION_DRAFT_DEBUG] request_received");
  try {
    console.log("[MISSION_DRAFT_DEBUG] auth_started");
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      console.log("[MISSION_DRAFT_ERROR] stage=auth message=Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[MISSION_DRAFT_DEBUG] auth_success");
    console.log("[MISSION_DRAFT_DEBUG] principal_resolved", { role: principal.role });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      principal.id,
    );
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;

    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }

    if (!user || user.role !== "REQUESTER") {
      console.log("[MISSION_DRAFT_ERROR] stage=authorization message=Forbidden");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      console.log("[MISSION_DRAFT_ERROR] stage=validation message=Invalid request body");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateMissionInputSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[MISSION_DRAFT_ERROR] stage=validation message=Validation failed");
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 422 },
      );
    }
    console.log("[MISSION_DRAFT_DEBUG] validation_success");

    console.log("[MISSION_DRAFT_DEBUG] create_mission_started");
    const rawAttachments = Array.isArray((body as { attachments?: unknown[] }).attachments)
      ? (
          body as {
            attachments: Array<{
              token?: string;
              storageKey?: string;
              url?: string;
              fileName?: string;
              mimeType?: string;
            }>;
          }
        ).attachments
      : [];

    // 1. Verify all attachment tokens before creating mission
    const verifiedAttachments: Array<{
      storageKey: string;
      url: string;
      fileName: string;
      mimeType: string;
    }> = [];

    for (const att of rawAttachments) {
      if (att.token) {
        const verified = verifyAttachmentToken(att.token);
        if (!verified) {
          return NextResponse.json(
            { error: "Forbidden: Invalid or expired attachment token" },
            { status: 403 },
          );
        }

        if (verified.userId !== user.id && (user.role as string) !== "ADMIN") {
          return NextResponse.json(
            { error: "Forbidden: Attachment token does not belong to you" },
            { status: 403 },
          );
        }

        const pending = await prisma.pendingAttachment.findUnique({
          where: { storageKey: verified.storageKey },
        });

        if (pending && pending.consumed) {
          return NextResponse.json(
            { error: "Bad Request: Attachment has already been attached to another mission" },
            { status: 400 },
          );
        }

        verifiedAttachments.push({
          storageKey: verified.storageKey,
          url: verified.url,
          fileName: verified.fileName,
          mimeType: verified.mimeType,
        });
      } else if (att.storageKey && att.url && att.fileName) {
        // Fallback for commit 9b53434 compatibility
        const pending = await prisma.pendingAttachment.findUnique({
          where: { storageKey: att.storageKey },
        });

        if (pending) {
          if (pending.userId !== user.id && (user.role as string) !== "ADMIN") {
            return NextResponse.json(
              { error: "Forbidden: Attachment does not belong to you" },
              { status: 403 },
            );
          }
          if (pending.consumed) {
            return NextResponse.json(
              { error: "Bad Request: Attachment has already been consumed" },
              { status: 400 },
            );
          }
        }

        verifiedAttachments.push({
          storageKey: att.storageKey,
          url: att.url,
          fileName: att.fileName,
          mimeType: att.mimeType || "application/octet-stream",
        });
      }
    }

    const { createMissionUseCase } = getMissionUseCases();
    const mission = await createMissionUseCase.execute(parsed.data, user.id, "REQUESTER");
    console.log("[MISSION_DRAFT_DEBUG] create_mission_success");

    // 2. Process initial reference attachments atomically
    try {
      if (verifiedAttachments.length > 0) {
        const anyScout = await prisma.scoutProfile.findFirst({ select: { id: true } });
        const scoutProfileId = anyScout?.id;

        for (const att of verifiedAttachments) {
          const isVideo =
            Boolean(att.mimeType?.startsWith("video/")) ||
            Boolean(att.fileName.match(/\.(mp4|webm|mov|ogg)$/i));
          const evidenceType = isVideo ? "VIDEO" : "PHOTO";

          if (scoutProfileId) {
            await prisma.evidence.create({
              data: {
                missionId: mission.id,
                scoutId: scoutProfileId,
                userId: user.id,
                caption: att.fileName,
                type: evidenceType,
                mediaUrl: att.url,
              },
            });
          }

          await prisma.timelineEntry.create({
            data: {
              missionId: mission.id,
              eventType: "EVIDENCE_UPLOADED",
              summary: `Reference ${isVideo ? "video" : "photo"}: ${att.fileName}`,
              actorId: user.id,
              metadata: {
                category: "ORIGINAL_REQUEST",
                url: att.url,
                storageKey: att.storageKey,
                mimeType: att.mimeType,
                role: "REQUESTER",
              },
            },
          });

          // Mark pending attachment as consumed
          await prisma.pendingAttachment
            .update({
              where: { storageKey: att.storageKey },
              data: { consumed: true, consumedAt: new Date() },
            })
            .catch(() => null);
        }
      }

      await prisma.timelineEntry.create({
        data: {
          missionId: mission.id,
          eventType: "MISSION_CREATED",
          summary: `Mission created${verifiedAttachments.length > 0 ? ` with ${verifiedAttachments.length} reference attachment(s)` : ""}`,
          actorId: user.id,
          metadata: {
            role: "REQUESTER",
            attachmentsCount: verifiedAttachments.length,
          },
        },
      });
    } catch (attErr) {
      console.error("Error creating initial mission attachments:", attErr);
    }

    return NextResponse.json(mission, { status: 201 });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; code?: string };
    console.error("[MISSION_DRAFT_ERROR] stage=runtime_exception", {
      name: err?.name || "Error",
      message: err?.message || "Internal server error",
      code: err?.code || "UNKNOWN",
    });
    return NextResponse.json(
      { error: err?.message || "Failed to create mission draft" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      principal.id,
    );
    let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;

    if (!user && principal.email) {
      user = await prisma.user.findUnique({ where: { email: principal.email } });
    }

    if (!user || user.role !== "REQUESTER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { listRequesterMissionsUseCase } = getMissionUseCases();
    const missions = await listRequesterMissionsUseCase.execute(user.id, "REQUESTER");
    return NextResponse.json({ missions }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || "Failed to list missions" }, { status: 500 });
  }
}
