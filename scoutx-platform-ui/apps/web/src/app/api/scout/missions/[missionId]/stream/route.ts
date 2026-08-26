import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { CloudflareStreamProvider } from "@scoutx/storage";

function getStreamProvider() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return null;
  }
  return new CloudflareStreamProvider({ accountId, apiToken });
}

export async function GET(
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

  // Authorization: Requester of the mission OR assigned Scout OR Admin
  const scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId: principal.id },
  });

  const isRequester = mission.requesterId === principal.id;
  const isAssignedScout = scoutProfile && mission.assignedScoutId === scoutProfile.id;
  const isAdmin = principal.role === "ADMIN";

  if (!isRequester && !isAssignedScout && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to view stream for this mission" },
      { status: 403 },
    );
  }

  // Find latest stream entries
  const latestStartEntry = await prisma.timelineEntry.findFirst({
    where: { missionId, eventType: "STREAM_STARTED" },
    orderBy: { createdAt: "desc" },
  });

  if (!latestStartEntry || !latestStartEntry.metadata) {
    return NextResponse.json({
      streamStatus: "OFFLINE",
      message: "No live stream has been started for this mission",
    });
  }

  const startMeta = latestStartEntry.metadata as Record<string, unknown>;
  const liveInputId = startMeta.liveInputId as string;

  const latestStopEntry = await prisma.timelineEntry.findFirst({
    where: { missionId, eventType: "STREAM_STOPPED" },
    orderBy: { createdAt: "desc" },
  });

  const isStopped = latestStopEntry && latestStopEntry.createdAt >= latestStartEntry.createdAt;

  const streamProvider = getStreamProvider();
  let liveStatus = isStopped ? "ENDED" : "LIVE";
  let recordingUrl = (startMeta.recordingUrl as string) || "";
  let recordingStatus = "PROCESSING";

  if (streamProvider && liveInputId) {
    try {
      const statusResult = await streamProvider.getLiveStatus(liveInputId);
      if (!isStopped && statusResult.status === "LIVE") {
        liveStatus = "LIVE";
      } else if (statusResult.status === "ENDED" || isStopped) {
        liveStatus = "ENDED";
      }

      if (statusResult.recordingUrl) {
        recordingUrl = statusResult.recordingUrl;
        recordingStatus = statusResult.recordingStatus || "READY";

        // Auto-link recording to Evidence if ready and not linked yet
        if (recordingStatus === "READY" && scoutProfile) {
          const existingEvidence = await prisma.evidence.findFirst({
            where: { missionId, mediaUrl: recordingUrl },
          });

          if (!existingEvidence) {
            await prisma.evidence.create({
              data: {
                missionId,
                scoutId: scoutProfile.id,
                userId: principal.id,
                caption: "Livestream Recording Evidence",
                type: "VIDEO",
                mediaUrl: recordingUrl,
              },
            });

            const submission = await prisma.missionSubmission.findUnique({
              where: { missionId },
            });

            if (submission) {
              const existingUrls = submission.mediaUrls || [];
              if (!existingUrls.includes(recordingUrl)) {
                await prisma.missionSubmission.update({
                  where: { missionId },
                  data: {
                    mediaUrls: [...existingUrls, recordingUrl],
                  },
                });
              }
            }
          }
        }
      }
    } catch {
      // Fallback to timeline entry state if Cloudflare API is unreachable
    }
  }

  // Security: NEVER return whipUrl (publish key) to viewers in GET response
  return NextResponse.json({
    streamStatus: liveStatus,
    liveInputId,
    whepUrl: (startMeta.whepUrl as string) || "",
    hlsPlaybackUrl: (startMeta.hlsPlaybackUrl as string) || "",
    recordingUrl: recordingUrl || null,
    recordingStatus,
    startedAt: startMeta.startedAt || latestStartEntry.createdAt,
  });
}
