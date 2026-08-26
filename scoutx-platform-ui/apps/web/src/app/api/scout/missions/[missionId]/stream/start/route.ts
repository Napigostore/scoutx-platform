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

  if (mission.status !== "IN_PROGRESS" && mission.status !== "MATCHED") {
    return NextResponse.json(
      { error: `Cannot start stream for mission in status ${mission.status}` },
      { status: 400 },
    );
  }

  try {
    const streamProvider = getStreamProvider();

    // Check if an active stream entry exists in timeline
    const latestStartEntry = await prisma.timelineEntry.findFirst({
      where: { missionId, eventType: "STREAM_STARTED" },
      orderBy: { createdAt: "desc" },
    });

    const latestStopEntry = await prisma.timelineEntry.findFirst({
      where: { missionId, eventType: "STREAM_STOPPED" },
      orderBy: { createdAt: "desc" },
    });

    const isCurrentlyActive =
      latestStartEntry &&
      (!latestStopEntry || latestStopEntry.createdAt < latestStartEntry.createdAt);

    if (isCurrentlyActive && latestStartEntry.metadata) {
      const meta = latestStartEntry.metadata as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        liveInputId: meta.liveInputId,
        whipUrl: meta.whipUrl,
        whepUrl: meta.whepUrl,
        hlsPlaybackUrl: meta.hlsPlaybackUrl,
      });
    }

    // Create new live input
    const streamResult = await streamProvider.createLiveInput({
      missionId,
      scoutId: principal.id,
    });

    // Record stream start in TimelineEntry
    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "STREAM_STARTED",
        summary: "Scout started a live video stream",
        actorId: principal.id,
        metadata: {
          provider: "CLOUDFLARE_STREAM",
          liveInputId: streamResult.liveInputId,
          whipUrl: streamResult.whipUrl,
          whepUrl: streamResult.whepUrl,
          hlsPlaybackUrl: streamResult.hlsPlaybackUrl,
          status: "LIVE",
          startedAt: new Date().toISOString(),
        },
      },
    });

    // Automatically update mission status to IN_PROGRESS if currently MATCHED
    if (mission.status === "MATCHED") {
      await prisma.mission.update({
        where: { id: missionId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({
      success: true,
      liveInputId: streamResult.liveInputId,
      whipUrl: streamResult.whipUrl,
      whepUrl: streamResult.whepUrl,
      hlsPlaybackUrl: streamResult.hlsPlaybackUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start stream";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
