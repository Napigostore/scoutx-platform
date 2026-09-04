/* eslint-disable */
import { NextResponse } from "next/server";
import { getMissionParticipantContext } from "@/lib/server-auth";
import { upsertSamplingPlan } from "@/lib/representative-sampling-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ missionId: string }> }) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isRequester && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Requester access required" }, { status: 403 });
  }

  const plan = await prisma.samplingPlan.findUnique({
    where: { missionId: params.missionId },
    include: { quotas: true },
  });

  return NextResponse.json({ plan: plan || null });
}

export async function POST(request: Request, props: { params: Promise<{ missionId: string }> }) {
  const params = await props.params;
  const ctx = await getMissionParticipantContext(request, params.missionId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isRequester && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden: Requester access required" }, { status: 403 });
  }

  const body = await request.json();
  const { strategy, variables, quotas } = body;

  try {
    const plan = await upsertSamplingPlan(
      params.missionId,
      strategy || "STRICT",
      variables || [],
      quotas || [],
    );
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
