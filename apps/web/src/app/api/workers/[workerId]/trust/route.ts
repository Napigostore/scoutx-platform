import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getWorkerTrustProfile } from "@/lib/worker-trust-service";

export async function GET(request: Request, { params }: { params: Promise<{ workerId: string }> }) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workerId } = await params;

  try {
    const profile = await getWorkerTrustProfile(workerId);
    if (!profile) {
      return NextResponse.json({ error: "Worker trust profile not found" }, { status: 404 });
    }

    const totalAttempted = profile.completedMissions + profile.rejectedMissions;
    const approvalRate =
      totalAttempted > 0 ? Math.round((profile.completedMissions / totalAttempted) * 100) : 100;

    // Public-Safe Trust Object for Requesters (DOES NOT expose fraudRiskScore or private risk signals)
    const publicSafeTrust = {
      workerId: profile.userId,
      trustScore: profile.trustScore,
      qualityScore: profile.qualityScore,
      trustLevel: profile.trustLevel,
      completedMissions: profile.completedMissions,
      approvalRate,
      profileVerified: profile.profileVerified,
      accountAgeDays: profile.accountAgeDays,
    };

    return NextResponse.json({ trust: publicSafeTrust }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch public trust profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
