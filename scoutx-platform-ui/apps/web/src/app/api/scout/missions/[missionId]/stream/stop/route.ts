import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { CloudflareStreamProvider } from "@scoutx/storage";

function getStreamProvider() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error(
      "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN environment variables",
    );
  }
  return new CloudflareStreamProvider({ accountId, apiToken });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { missionId } = await params;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { assignedScout: true },
  });

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  // Verify Scout Ownership
  const scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId: principal.id },
  });

  if (
    principal.role !== "ADMIN" &&
    (!scoutProfile || mission.assignedScoutId !== scoutProfile.id)
  ) {
    return NextResponse.json(
      { error: "Forbidden: You are not assigned to this mission" },
      { status: 403 },
    );
  }

  try {
    const streamProvider = getStreamProvider();

    // Find latest stream start entry
    const latestStartEntry = await prisma.timelineEntry.findFirst({
      where: { missionId, eventType: "STREAM_STARTED" },
      orderBy: { createdAt: "desc" },
    });

    if (!latestStartEntry || !latestStartEntry.metadata) {
      return NextResponse.json(
        { error: "No active stream found for this mission" },
        { status: 400 },
      );
    }

    const meta = latestStartEntry.metadata as Record<string, unknown>;
    const liveInputId = meta.liveInputId as string;

    // Check Cloudflare stream status & recording
    const statusResult = await streamProvider.getLiveStatus(liveInputId);

    // Record stream stop in TimelineEntry
    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "STREAM_STOPPED",
        summary: "Scout stopped the live video stream",
        actorId: principal.id,
        metadata: {
          provider: "CLOUDFLARE_STREAM",
          liveInputId,
          status: "ENDED",
          recordingUrl: statusResult.recordingUrl || null,
          recordingStatus: statusResult.recordingStatus || "PROCESSING",
          endedAt: new Date().toISOString(),
        },
      },
    });

    // If recording is immediately ready, link it as Evidence & MissionSubmission mediaUrl
    if (statusResult.recordingUrl && scoutProfile) {
      await prisma.evidence.create({
        data: {
          missionId,
          scoutId: scoutProfile.id,
          userId: principal.id,
          caption: "Livestream Recording Evidence",
          type: "VIDEO",
          mediaUrl: statusResult.recordingUrl,
        },
      });

      const submission = await prisma.missionSubmission.findUnique({
        where: { missionId },
      });

      if (submission) {
        const existingUrls = submission.mediaUrls || [];
        if (!existingUrls.includes(statusResult.recordingUrl)) {
          await prisma.missionSubmission.update({
            where: { missionId },
            data: {
              mediaUrls: [...existingUrls, statusResult.recordingUrl],
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      liveInputId,
      recordingUrl: statusResult.recordingUrl || null,
      recordingStatus: statusResult.recordingStatus || "PROCESSING",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to stop stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
