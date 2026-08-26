"use client";

import { useState } from "react";
import { cn } from "@scoutx/ui";
import { EvidenceGallery, type EvidenceItem } from "./evidence-gallery";
import { Timeline, type TimelineEvent } from "./timeline";
import { FieldNotes, type FieldNote } from "./field-notes";
import { VerificationPanel, type VerificationItem } from "./verification-panel";
import { RelatedCases, type RelatedCase } from "./related-cases";
import { BountyHistory, type BountyHistoryEntry } from "./bounty-history";
import { EvidenceFilters, type EvidenceFilterOptions } from "./evidence-filters";
import { StickyActionPanel } from "./sticky-action-panel";
import { useRealtimeEvent } from "../../providers/realtime-event-provider";

/* ─── Types ─── */
export interface InvestigationWorkspaceData {
  /** Investigation ID */
  id: string;
  /** Investigation title */
  title: string;
  /** Current bounty in whole coins */
  currentBounty: number;
  /** Gallery evidence items */
  evidence: EvidenceItem[];
  /** Timeline of events */
  timeline: TimelineEvent[];
  /** Field notes */
  notes: FieldNote[];
  /** Verification checklist */
  verification: VerificationItem[];
  /** Related cases */
  relatedCases: RelatedCase[];
  /** Bounty history entries */
  bountyHistory: BountyHistoryEntry[];
}

interface InvestigationWorkspaceProps {
  data: InvestigationWorkspaceData;
  className?: string;
}

/* ─── Default Filters ─── */
const DEFAULT_FILTERS: EvidenceFilterOptions = {
  query: "",
  verified: "all",
  sort: "newest",
};

/* ─── Component ─── */
export function InvestigationWorkspace({ data, className }: InvestigationWorkspaceProps) {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(data.evidence);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(data.timeline);
  const [bountyAmount, setBountyAmount] = useState<number>(data.currentBounty);
  const [verificationItems, setVerificationItems] = useState<VerificationItem[]>(data.verification);
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>(data.relatedCases);
  const [filters, setFilters] = useState<EvidenceFilterOptions>(DEFAULT_FILTERS);

  // Realtime Event Handler
  useRealtimeEvent("*", (event) => {
    if (event.investigationId && event.investigationId !== data.id) return;

    switch (event.type) {
      // 1. Evidence Gallery updates
      case "evidence.created":
        setEvidenceItems((prev) => [
          event.item,
          ...prev.filter((item) => item.id !== event.item.id),
        ]);
        break;

      case "evidence.updated":
        setEvidenceItems((prev) =>
          prev.map((item) => (item.id === event.item.id ? { ...item, ...event.item } : item)),
        );
        break;

      case "evidence.deleted":
        setEvidenceItems((prev) => prev.filter((item) => item.id !== event.evidenceId));
        break;

      case "evidence.upload.completed":
        setEvidenceItems((prev) => [
          {
            id: event.evidenceId,
            photoUrl: event.photoUrl,
            caption: "Uploaded Evidence",
            capturedAt: new Date().toISOString(),
            verified: false,
            mimeType: event.mimeType,
          },
          ...prev.filter((item) => item.id !== event.evidenceId),
        ]);
        break;

      case "evidence.verified":
        setEvidenceItems((prev) =>
          prev.map((item) =>
            item.id === event.evidenceId ? { ...item, verified: event.verified } : item,
          ),
        );
        setVerificationItems((prev) =>
          prev.map((item) =>
            item.id === event.evidenceId
              ? { ...item, status: event.verified ? "verified" : "pending" }
              : item,
          ),
        );
        break;

      // 2. Timeline updates
      case "timeline.created":
        setTimelineEvents((prev) => [event.event, ...prev.filter((e) => e.id !== event.event.id)]);
        // 5. Update related cases / tracked counts dynamically when timeline activity occurs
        setRelatedCases((prev) =>
          prev.map((c) => ({
            ...c,
            status: c.status === "open" ? "active" : c.status,
          })),
        );
        break;

      // 3. Coin panel updates
      case "coin.updated":
        if (typeof event.currentBounty === "number") {
          setBountyAmount(event.currentBounty);
        } else if (typeof event.amount === "number") {
          setBountyAmount(event.amount);
        }
        break;

      case "mission.updated":
        if (typeof event.currentBounty === "number") {
          setBountyAmount(event.currentBounty);
        }
        break;

      case "coin.released":
        setBountyAmount((prev) => Math.max(0, prev - event.amount));
        break;

      // 4. Trust panel updates
      case "trust.updated":
        setVerificationItems((prev) =>
          prev.map((v) => ({
            ...v,
            status: event.trustScore > 50 ? "verified" : v.status,
          })),
        );
        break;
    }
  });

  // Filter evidence
  const filteredEvidence = evidenceItems.filter((item) => {
    if (filters.query && !item.caption.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.verified === "verified" && !item.verified) return false;
    if (filters.verified === "unverified" && item.verified) return false;
    return true;
  });

  const sortedEvidence = [...filteredEvidence].sort((a, b) => {
    if (filters.sort === "newest") return b.capturedAt.localeCompare(a.capturedAt);
    return a.capturedAt.localeCompare(b.capturedAt);
  });

  return (
    <>
      <div
        className={cn(
          "relative mx-auto grid max-w-7xl gap-6 px-4 pb-24 pt-6 md:px-8 md:pb-8 lg:grid-cols-[280px_1fr_280px]",
          className,
        )}
      >
        {/* ─── Left Sidebar ─── */}
        <aside className="order-2 flex flex-col gap-6 lg:order-1">
          <Timeline events={timelineEvents} />
          <BountyHistory entries={data.bountyHistory} currentAmount={bountyAmount} />
          <VerificationPanel items={verificationItems} />
        </aside>

        {/* ─── Main Content ─── */}
        <main className="order-1 flex flex-col gap-6 lg:order-2">
          <EvidenceFilters filters={filters} onChange={setFilters} />
          <EvidenceGallery
            items={sortedEvidence}
            missionId={data.id}
            onItemsChange={setEvidenceItems}
          />
          <FieldNotes notes={data.notes} />
        </main>

        {/* ─── Right Sidebar ─── */}
        <aside className="order-3 flex flex-col gap-6">
          <RelatedCases cases={relatedCases} />
        </aside>
      </div>

      {/* ─── Sticky Action Panel (bottom on mobile, right sidebar on desktop) ─── */}
      <StickyActionPanel
        investigationId={data.id}
        investigationTitle={data.title}
        bountyAmount={bountyAmount}
      />
    </>
  );
}
