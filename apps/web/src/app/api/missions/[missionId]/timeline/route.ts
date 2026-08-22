import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const { missionId } = await params;

  // 1. Mission Participant Authorization Check (Requester or Assigned Scout)
  const participantCtx = await getMissionParticipantContext(request, missionId);
  if (!participantCtx || "error" in participantCtx) {
    const errorMsg =
      participantCtx && "error" in participantCtx ? participantCtx.error : "Unauthorized";
    const errorStatus = participantCtx && "status" in participantCtx ? participantCtx.status : 401;
    return NextResponse.json({ error: errorMsg }, { status: errorStatus });
  }

  try {
    // Fetch timeline entries for this mission
    const timelineEntries = await prisma.timelineEntry.findMany({
      where: { missionId },
      orderBy: { createdAt: "asc" },
    });

    // Fetch evidence records for this mission
    const evidenceRecords = await prisma.evidence.findMany({
      where: { missionId },
      orderBy: { createdAt: "asc" },
    });

    // Collect all actor user IDs to populate names & avatars
    const userIds = new Set<string>();
    if (participantCtx.mission.requesterId) userIds.add(participantCtx.mission.requesterId);

    timelineEntries.forEach((entry) => {
      if (entry.actorId) userIds.add(entry.actorId);
    });

    evidenceRecords.forEach((ev) => {
      if (ev.userId) userIds.add(ev.userId);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, displayName: true, avatarUrl: true, role: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Track URLs already represented in timeline entries to avoid duplicate rendering
    const timelineMediaUrls = new Set<string>();

    // Format timeline items
    const formattedTimelineEvents = timelineEntries.map((entry) => {
      const actor = entry.actorId ? userMap.get(entry.actorId) : null;
      const meta = (entry.metadata as Record<string, unknown> | null) || {};
      const mediaUrl = (meta.url as string) || null;

      if (mediaUrl) {
        timelineMediaUrls.add(mediaUrl);
      }

      return {
        id: entry.id,
        eventType: entry.eventType,
        summary: entry.summary,
        mediaUrl,
        type: (meta.mimeType as string)?.startsWith("video/") ? "VIDEO" : "PHOTO",
        metadata: entry.metadata,
        createdAt: entry.createdAt.toISOString(),
        actor: actor
          ? {
              id: actor.id,
              displayName: actor.displayName,
              avatarUrl: actor.avatarUrl,
              role: (meta.role as string) || actor.role,
            }
          : {
              id: "system",
              displayName: "System",
              avatarUrl: null,
              role: "SYSTEM",
            },
      };
    });

    // Format historical evidence items that do not have a corresponding timeline entry
    const legacyEvidenceEvents = evidenceRecords
      .filter((ev) => !ev.mediaUrl || !timelineMediaUrls.has(ev.mediaUrl))
      .map((ev) => {
        const actor = userMap.get(ev.userId);
        return {
          id: `ev-${ev.id}`,
          eventType: "EVIDENCE_UPLOADED",
          summary: ev.caption || `Uploaded evidence file`,
          mediaUrl: ev.mediaUrl,
          type: ev.type,
          createdAt: ev.createdAt.toISOString(),
          actor: actor
            ? {
                id: actor.id,
                displayName: actor.displayName,
                avatarUrl: actor.avatarUrl,
                role: actor.role,
              }
            : {
                id: ev.userId,
                displayName: "Scout",
                avatarUrl: null,
                role: "SCOUT",
              },
        };
      });

    // Combine and sort by createdAt ASC
    const combinedEvents = [...formattedTimelineEvents, ...legacyEvidenceEvents].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return NextResponse.json({ events: combinedEvents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch timeline";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
