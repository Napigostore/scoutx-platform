import { NextResponse } from "next/server";
import { PrismaMissionRepository } from "@scoutx/infrastructure";
import { GetMissionDetailsUseCase, UpdateMissionUseCase } from "@scoutx/application";
import { CreateMissionInputSchema } from "@scoutx/types";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";

function getMissionUseCases() {
  const missionRepo = new PrismaMissionRepository();
  return {
    getMissionDetailsUseCase: new GetMissionDetailsUseCase(missionRepo),
    updateMissionUseCase: new UpdateMissionUseCase(missionRepo),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;

  try {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        location: true,
        recipients: { select: { userId: true } },
        assignedScout: { select: { userId: true } },
      },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const principal = await getAuthenticatedPrincipal(request);
    let currentUserId: string | null = null;
    let userRole: string | null = null;

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
        userRole = user.role;
      }
    }

    if (mission.status === "DRAFT") {
      if (mission.requesterId !== currentUserId && userRole !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view this draft" },
          { status: 403 },
        );
      }
    }

    // Server-Side Authorization for PRIVATE & INDIVIDUAL missions
    if (mission.visibility !== "PUBLIC") {
      let isAuthorized = false;

      if (
        userRole === "ADMIN" ||
        mission.requesterId === currentUserId ||
        mission.assignedScout?.userId === currentUserId ||
        mission.recipients.some((r) => r.userId === currentUserId)
      ) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view this mission" },
          { status: 403 },
        );
      }
    }

    // Fetch submission if status is SUBMITTED or later
    let submission = null;
    if (
      mission.status === "SUBMITTED" ||
      mission.status === "VERIFIED" ||
      mission.status === "COMPLETED"
    ) {
      submission = await prisma.missionSubmission.findFirst({
        where: { missionId },
      });
    }

    // Fetch original reference attachments if any
    const referenceTimeline = await prisma.timelineEntry.findMany({
      where: { missionId, eventType: "EVIDENCE_UPLOADED" },
    });

    const referenceAttachments = referenceTimeline
      .filter(
        (tl) =>
          (tl.metadata as Record<string, unknown> | null)?.category === "ORIGINAL_REQUEST" ||
          (tl.metadata as Record<string, unknown> | null)?.role === "REQUESTER",
      )
      .map((tl) => {
        const meta = (tl.metadata as Record<string, unknown> | null) || {};
        const rawUrl = (meta.url as string) || "";
        const storageKey = (meta.storageKey as string) || "";

        let freshUrl = rawUrl;
        if (storageKey && storageKey.trim()) {
          freshUrl = `/api/evidence/download?key=${encodeURIComponent(storageKey.trim())}`;
        } else if (rawUrl.includes("pre-creation-reference/") || rawUrl.includes("evidence/")) {
          const r2Match = rawUrl.match(/(pre-creation-reference\/[^?#]+|evidence\/[^?#]+)/);
          if (r2Match?.[1]) {
            freshUrl = `/api/evidence/download?key=${encodeURIComponent(r2Match[1])}`;
          }
        }

        return {
          url: freshUrl,
          fileName:
            (meta.fileName as string) ||
            (tl.summary ? tl.summary.replace(/^Reference (video|photo): /, "") : "attachment"),
          mimeType: (meta.mimeType as string) || "application/octet-stream",
          createdAt: tl.createdAt.toISOString(),
        };
      });

    let isRequester = false;
    let isAssignedOrRecipient = false;
    let hasSubmittedEvidence = false;
    let hasSubmittedReport = false;
    let canRequestReward = false;

    if (principal) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        principal.id,
      );
      let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
      if (!user && principal.email) {
        user = await prisma.user.findUnique({ where: { email: principal.email } });
      }

      const targetUserId = user ? user.id : principal.id;
      const targetRole = user ? user.role : principal.role;

      isRequester = mission.requesterId === targetUserId || targetRole === "ADMIN";
      isAssignedOrRecipient =
        mission.assignedScout?.userId === targetUserId ||
        mission.recipients.some((r) => r.userId === targetUserId);

      const userEvidenceCount = await prisma.evidence.count({
        where: { missionId, userId: targetUserId },
      });
      const userSubmissionCount = await prisma.missionSubmission.count({
        where: { missionId, userId: targetUserId },
      });
      const userTimelineCount = await prisma.timelineEntry.count({
        where: { missionId, actorId: targetUserId },
      });

      hasSubmittedEvidence = userEvidenceCount > 0;
      hasSubmittedReport = userSubmissionCount > 0 || userEvidenceCount > 0;
      canRequestReward =
        mission.requesterId !== targetUserId &&
        (hasSubmittedEvidence || userSubmissionCount > 0 || userTimelineCount > 0);
    }

    const userContext = {
      isRequester,
      isAssignedOrRecipient,
      hasSubmittedEvidence,
      hasSubmittedReport,
      canCompleteMission: isRequester || hasSubmittedReport,
      canRequestReward,
      canDispute: isRequester || isAssignedOrRecipient || hasSubmittedReport,
    };

    const uniqueParticipants = new Set<string>();
    if (mission.recipients) {
      for (const r of mission.recipients) {
        if (r.userId) uniqueParticipants.add(r.userId);
      }
    }
    if (mission.assignedScout?.userId) {
      uniqueParticipants.add(mission.assignedScout.userId);
    }
    if (submission?.userId) {
      uniqueParticipants.add(submission.userId);
    }
    const allEvidenceUsers = await prisma.evidence.findMany({
      where: { missionId },
      select: { userId: true },
    });
    for (const ev of allEvidenceUsers) {
      if (ev.userId) uniqueParticipants.add(ev.userId);
    }
    const participantCount = uniqueParticipants.size;
    const participantsList = await prisma.user.findMany({
      where: { id: { in: Array.from(uniqueParticipants) } },
      select: { id: true, displayName: true, role: true },
    });

    const responsePayload = {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      category: mission.category,
      status: mission.status,
      urgency: mission.urgency,
      visibility: mission.visibility,
      publicLogs: mission.publicLogs,
      budget: {
        amountCents: mission.budgetCents,
        currency: mission.currency,
      },
      coordinates: {
        latitude: mission.latitude,
        longitude: mission.longitude,
      },
      radiusMeters: mission.radiusMeters,
      requesterId: mission.requesterId,
      assignedScoutId: mission.assignedScoutId,
      requiredTags: mission.requiredTags,
      expiresAt: mission.expiresAt.toISOString(),
      createdAt: mission.createdAt.toISOString(),
      updatedAt: mission.updatedAt.toISOString(),
      participantCount,
      participants: participantsList,
      submission,
      referenceAttachments,
      userContext,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get mission details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: principal.id } });
  if (!user || (user.role !== "REQUESTER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { missionId } = await params;
  const existingMission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!existingMission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  if (existingMission.requesterId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Handle visibility update (e.g. PUBLIC -> PRIVATE at any time by owner or admin)
  if (body.visibility !== undefined || body.publicLogs !== undefined) {
    const updated = await prisma.mission.update({
      where: { id: missionId },
      data: {
        ...(body.visibility ? { visibility: body.visibility } : {}),
        ...(body.publicLogs !== undefined ? { publicLogs: Boolean(body.publicLogs) } : {}),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  }

  const parsed = CreateMissionInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 422 },
    );
  }

  try {
    const { updateMissionUseCase } = getMissionUseCases();
    const mission = await updateMissionUseCase.execute(
      missionId,
      parsed.data,
      principal.id,
      user.role,
    );
    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update mission";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
