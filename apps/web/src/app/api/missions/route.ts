import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { CreateMissionUseCase, ListRequesterMissionsUseCase } from "@scoutx/application";
import { CreateMissionInputSchema } from "@scoutx/types";
import { prisma } from "@/lib/prisma";

import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { verifyAttachmentToken } from "@/lib/attachment-auth";
import { fetchRequesterMissionsSummary } from "@/lib/mission-summary-service";

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

    if (!user || (user.role !== "REQUESTER" && user.role !== "ADMIN")) {
      console.log("[MISSION_DRAFT_ERROR] stage=authorization message=Permission denied");
      return NextResponse.json(
        {
          error: "PERMISSION_DENIED",
          message:
            "Only Requesters or Admins can create missions. Please sign in with a Requester account.",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      console.log("[MISSION_DRAFT_ERROR] stage=validation message=Invalid request body");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateMissionInputSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[MISSION_DRAFT_ERROR] stage=validation message=Validation failed");
      const fieldErrors: Record<string, string> = {};
      const formatted = parsed.error.format();
      if (formatted.title?._errors?.length) fieldErrors.title = formatted.title._errors[0]!;
      if (formatted.description?._errors?.length)
        fieldErrors.description = formatted.description._errors[0]!;
      if (formatted.category?._errors?.length)
        fieldErrors.category = formatted.category._errors[0]!;
      if (formatted.budget?._errors?.length) fieldErrors.budget = formatted.budget._errors[0]!;
      if (formatted.coordinates?._errors?.length)
        fieldErrors.coordinates = formatted.coordinates._errors[0]!;

      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields before submitting.",
          fields: fieldErrors,
          details: formatted,
        },
        { status: 422 },
      );
    }
    console.log("[MISSION_DRAFT_DEBUG] validation_success");

    // --- COIN & QUOTA CHECK ---
    const budget = parsed.data.budget?.amountCents || 0;
    const { PrismaCoinRepository } = await import("@scoutx/infrastructure");
    const coinRepo = new PrismaCoinRepository();
    const balance = await coinRepo.balanceByUserId(user.id);
    const hasFreeQuota = (user.freeMissions || 0) > 0;

    if (!hasFreeQuota && balance < budget) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_FUNDS",
          message: "Bạn đã hết lượt miễn phí. Hãy nạp coin để tạo nhiệm vụ.",
        },
        { status: 402 },
      );
    }
    // --- END CHECK ---

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

    for (const rawAtt of rawAttachments) {
      const att = typeof rawAtt === "string" ? { storageKey: rawAtt } : rawAtt;

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
      } else {
        const keyOrUrl = att.storageKey || att.url || (typeof rawAtt === "string" ? rawAtt : "");
        if (!keyOrUrl) continue;

        const pending = await prisma.pendingAttachment.findFirst({
          where: {
            OR: [{ storageKey: keyOrUrl }, { mediaUrl: keyOrUrl }, { id: keyOrUrl }],
          },
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

          verifiedAttachments.push({
            storageKey: pending.storageKey,
            url: pending.mediaUrl,
            fileName: pending.fileName,
            mimeType: pending.mimeType,
          });
        } else if (att.storageKey && att.url && att.fileName) {
          verifiedAttachments.push({
            storageKey: att.storageKey,
            url: att.url,
            fileName: att.fileName,
            mimeType: att.mimeType || "application/octet-stream",
          });
        }
      }
    }

    const { createMissionUseCase } = getMissionUseCases();
    const mission = await createMissionUseCase.execute(parsed.data, user.id, "REQUESTER");
    console.log("[MISSION_DRAFT_DEBUG] create_mission_success");

    // Deduct quota or coins
    if (hasFreeQuota) {
      await prisma.user.update({
        where: { id: user.id },
        data: { freeMissions: { decrement: 1 } },
      });
    } else if (budget > 0) {
      await prisma.coinTransaction.create({
        data: {
          userId: user.id,
          amountCents: -budget,
          currency: "VND",
          reason: "MISSION_FUNDING",
          description: `Funded mission ${mission.id}`,
          eventType: "DEBIT",
          missionId: mission.id,
        },
      });
    }

    // Save Mission Visibility & Individual Recipients
    const visibility =
      body.visibility === "PRIVATE" || body.visibility === "INDIVIDUAL"
        ? body.visibility
        : "PUBLIC";
    const publicLogs = body.publicLogs !== undefined ? Boolean(body.publicLogs) : true;

    const targetCities: string[] = Array.isArray(body.targetCities) ? body.targetCities : [];
    const targetGender: string = typeof body.targetGender === "string" ? body.targetGender : "ANY";
    const targetAgeRange: string =
      typeof body.targetAgeRange === "string" ? body.targetAgeRange : "ANY";
    const targetExperienceLevel: string =
      typeof body.targetExperienceLevel === "string" ? body.targetExperienceLevel : "ANY";
    const targetLanguages: string[] = Array.isArray(body.targetLanguages)
      ? body.targetLanguages
      : [];

    await prisma.mission.update({
      where: { id: mission.id },
      data: {
        visibility,
        publicLogs,
        targetCities,
        targetGender,
        targetAgeRange,
        targetExperienceLevel,
        targetLanguages,
      },
    });

    if (visibility === "INDIVIDUAL") {
      const recipientUsernames: string[] = Array.isArray(body.recipientUsernames)
        ? body.recipientUsernames
        : typeof body.recipientUsername === "string"
          ? [body.recipientUsername]
          : [];
      const recipientIds: string[] = Array.isArray(body.recipientIds) ? body.recipientIds : [];

      const cleanUsernames = recipientUsernames
        .map((u) => u.replace(/^@/, "").trim())
        .filter(Boolean);

      const targetUsers = await prisma.user.findMany({
        where: {
          OR: [
            ...(recipientIds.length > 0 ? [{ id: { in: recipientIds } }] : []),
            ...(cleanUsernames.length > 0
              ? cleanUsernames.map((u) => ({
                  displayName: { equals: u, mode: "insensitive" as const },
                }))
              : []),
          ],
        },
        select: { id: true },
      });

      if (targetUsers.length > 0) {
        await prisma.missionRecipient.createMany({
          data: targetUsers.map((u) => ({
            missionId: mission.id,
            userId: u.id,
          })),
          skipDuplicates: true,
        });
      }
    }

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
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const status = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const sort = searchParams.get("sort") || "recommended";
    const q = searchParams.get("q") || searchParams.get("query") || "";

    let requesterUserId: string | null = null;
    let currentUserId: string | null = null;

    const principal = await getAuthenticatedPrincipal(request);
    if (principal) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        principal.id,
      );
      let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
      if (!user && principal.email) {
        user = await prisma.user.findUnique({ where: { email: principal.email } });
      }
      if (user) {
        currentUserId = user.id;
        if (scope === "mine") {
          requesterUserId = user.id;
        }
      }
    }

    const result = await fetchRequesterMissionsSummary(
      requesterUserId,
      {
        status,
        page,
        limit,
        sort,
        q,
      },
      currentUserId,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || "Failed to list missions" }, { status: 500 });
  }
}
