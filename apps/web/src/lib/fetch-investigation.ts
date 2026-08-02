import { cache } from "react";
import {
  PrismaMissionRepository,
  PrismaEvidenceRepository,
  PrismaTimelineRepository,
  PrismaCoinRepository,
  PrismaTrustRepository,
  PrismaScoutRepository,
} from "@scoutx/infrastructure";
import type { InvestigationHeroData } from "@/components/investigation/investigation-hero";
import type { InvestigationWorkspaceData } from "@/components/investigation/investigation-workspace";
import type { EvidenceItem } from "@/components/investigation/evidence-gallery";
import type { TimelineEvent } from "@/components/investigation/timeline";
import type { FieldNote } from "@/components/investigation/field-notes";
import type { VerificationItem } from "@/components/investigation/verification-panel";
import type { RelatedCase } from "@/components/investigation/related-cases";
import type { BountyHistoryEntry } from "@/components/investigation/bounty-history";

const missionRepo = new PrismaMissionRepository();
const evidenceRepo = new PrismaEvidenceRepository();
const timelineRepo = new PrismaTimelineRepository();
const coinRepo = new PrismaCoinRepository();
const trustRepo = new PrismaTrustRepository();
const scoutRepo = new PrismaScoutRepository();

function formatCategory(cat: string): string {
  return cat;
}

function toHeroStatus(s: string | undefined): "hot" | "warm" | "cold" {
  if (s === "hot" || s === "warm") return s;
  return "cold";
}

interface FetchResult {
  hero: InvestigationHeroData;
  workspace: InvestigationWorkspaceData;
}

async function fetchInvestigation(id: string): Promise<FetchResult> {
  const mission = await missionRepo.findById(id);
  if (!mission) throw new Error("Investigation not found");

  const [evidenceRecords, timelineEntries, coinTransactions, trustScore] = await Promise.all([
    evidenceRepo.findByMissionId(id),
    timelineRepo.findByMissionId(id),
    coinRepo.findByMissionId(id),
    mission.assignedScoutId
      ? trustRepo.findScoreByUserId(mission.assignedScoutId)
      : Promise.resolve(null),
  ]);

  const scoutIds = new Set<string>();
  for (const ev of evidenceRecords) scoutIds.add(ev.scoutId);
  for (const tl of timelineEntries) if (tl.actorId) scoutIds.add(tl.actorId);
  if (mission.assignedScoutId) scoutIds.add(mission.assignedScoutId);
  scoutIds.add(mission.requesterId);

  const scoutMap = new Map<string, string>();
  await Promise.all(
    Array.from(scoutIds).map(async (sid) => {
      const profile = await scoutRepo.findById(sid).catch(() => null);
      scoutMap.set(sid, profile?.displayName ?? sid.slice(0, 8));
    }),
  );

  const hero: InvestigationHeroData = {
    id: mission.id,
    title: mission.title,
    brief: mission.description,
    category: formatCategory(mission.category),
    location: `Lat ${mission.coordinates.latitude.toFixed(2)}, Lng ${mission.coordinates.longitude.toFixed(2)}`,
    photoUrl: "",
    bounty: {
      amount: Math.round(mission.budget.amountCents / 100),
      escalationAmount: 10,
      escalationInterval: "30 min",
      maxCap: Math.round(mission.budget.amountCents / 50),
    },
    trust: {
      rating: trustScore?.score ? trustScore.score / 20 : 4.0,
      count: trustScore ? 1 : 0,
      requesterName: scoutMap.get(mission.requesterId) ?? "Unknown",
    },
    market: {
      status: toHeroStatus(mission.status),
      watcherCount: 0,
      nearbyScoutCount: 0,
    },
  };

  const evidence: EvidenceItem[] = evidenceRecords.map((ev) => ({
    id: ev.id,
    photoUrl: ev.mediaUrl ?? "",
    caption: ev.caption,
    capturedAt: ev.capturedAt.toISOString(),
    capturedBy: scoutMap.get(ev.scoutId) ?? ev.scoutId,
    verified: ev.verified,
    mimeType: ev.type === "VIDEO" ? "video/mp4" : "image/jpeg",
  }));

  const timeline: TimelineEvent[] = timelineEntries.map((tl) => ({
    id: tl.id,
    type: mapTimelineType(tl.eventType),
    summary: tl.summary,
    detail: (tl.metadata?.detail as string) ?? undefined,
    actor: tl.actorId ? (scoutMap.get(tl.actorId) ?? tl.actorId) : "System",
    timestamp: tl.createdAt.toISOString(),
  }));

  const verification: VerificationItem[] = evidenceRecords.map((ev) => ({
    id: `vr-${ev.id}`,
    label: ev.caption,
    status: ev.verified ? ("verified" as const) : ("pending" as const),
    verifierCount: ev.verified ? 2 : 0,
    threshold: 2,
  }));

  const bountyHistory: BountyHistoryEntry[] = coinTransactions.map((ct) => ({
    id: ct.id,
    amount: Math.round(ct.amountCents / 100),
    reason: ct.reason,
    triggeredBy: ct.eventType,
    timestamp: ct.createdAt.toISOString(),
  }));

  const currentBounty = Math.round(mission.budget.amountCents / 100);

  const workspace: InvestigationWorkspaceData = {
    id: mission.id,
    title: mission.title,
    currentBounty,
    evidence,
    timeline,
    notes: [] as FieldNote[],
    verification,
    relatedCases: [] as RelatedCase[],
    bountyHistory,
  };

  return { hero, workspace };
}

function mapTimelineType(eventType: string): TimelineEvent["type"] {
  const map: Record<string, TimelineEvent["type"]> = {
    created: "created",
    evidence: "evidence",
    update: "update",
    verify: "verify",
    note: "note",
    scout_joined: "scout_joined",
  };
  return map[eventType] ?? "update";
}

export const getInvestigationData = cache(fetchInvestigation);
