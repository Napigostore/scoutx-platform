import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-service";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id: missionId } = await props.params;

  // 1. Authenticate via API Key or Session
  let userId: string | null = null;
  let isAdmin = false;

  const apiKeyAuth = await authenticateApiKey(request);
  if (apiKeyAuth) {
    userId = apiKeyAuth.userId;
    isAdmin = apiKeyAuth.user?.role === "ADMIN";
  } else {
    const ctx = await getMissionParticipantContext(request, missionId);
    if (!("error" in ctx)) {
      userId = ctx.userId;
      isAdmin = ctx.isAdmin;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      surveySubmissions: true,
      evidence: true,
      samplingPlan: { include: { quotas: true } },
    },
  });

  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  if (mission.requesterId !== userId && !isAdmin) {
    return NextResponse.json({ error: "Forbidden: Requester access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  if (format.toLowerCase() === "csv") {
    // Generate CSV format
    const headers = [
      "SubmissionId",
      "ParticipantId",
      "Status",
      "DurationSeconds",
      "QualityScore",
      "SubmittedAt",
    ];
    const rows = mission.surveySubmissions.map((s) => [
      s.id,
      s.participantId,
      s.status,
      s.durationSeconds ?? "",
      s.qualityScore ?? "",
      s.submittedAt ? s.submittedAt.toISOString() : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="mission_${missionId}_export.csv"`,
      },
    });
  }

  // Default JSON export
  return NextResponse.json({
    exportTimestamp: new Date().toISOString(),
    mission: {
      id: mission.id,
      title: mission.title,
      status: mission.status,
      category: mission.category,
      createdAt: mission.createdAt,
    },
    samplingPlan: mission.samplingPlan,
    surveySubmissionsCount: mission.surveySubmissions.length,
    surveySubmissions: mission.surveySubmissions,
    evidenceCount: mission.evidence.length,
    evidence: mission.evidence,
  });
}
