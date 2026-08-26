"use client";

import { cn } from "@scoutx/ui";
import { LeftNavigation, type NavSection } from "./left-navigation";
import { MissionCenter, type MissionCenterData } from "./mission-center";
import { EvidenceWorkspace, type EvidenceItem } from "./evidence-workspace";
import { LiveChatPlaceholder } from "./live-chat-placeholder";
import { AiAssistantPlaceholder } from "./ai-assistant-placeholder";
import { MissionTimeline, type MissionTimelineEvent } from "./mission-timeline";
import { MissionActivity, type MissionActivityItem } from "./mission-activity";
import { CoinPanel, type CoinPanelData } from "./coin-panel";
import { TrustPanel, type ScoutTrustInfo, type VerifierInfo } from "./trust-panel";
import { StickyActionBar } from "./sticky-action-bar";

/* ─── Types ─── */

export interface MissionOsData {
  /** Navigation sections */
  navSections: NavSection[];
  /** Active nav item ID */
  activeNavItemId: string;
  /** Mission center data */
  missionCenter: MissionCenterData;
  /** Evidence items */
  evidence: EvidenceItem[];
  /** Timeline events */
  timeline: MissionTimelineEvent[];
  /** Activity items */
  activity: MissionActivityItem[];
  /** Coin/bounty data */
  coinPanel: CoinPanelData;
  /** Scout trust info */
  scouts: ScoutTrustInfo[];
  /** Verifier info */
  verifiers: VerifierInfo[];
}

interface MissionOsProps {
  data: MissionOsData;
  className?: string;
}

/**
 * MissionOS is the full Mission Operating System layout.
 * Designed to feel like:
 *   Linear (left nav + clean hierarchy) +
 *   Notion (rich content blocks) +
 *   Bloomberg (data panels, compact density) +
 *   Google Maps (spatial awareness via mission center map)
 *
 * Layout (desktop):
 * ┌─────┬──────────────────────┬──────────┐
 * │ Nav │   Mission Center      │ Timeline  │
 * │     │   Evidence Workspace  │ Activity  │
 * │     │   AI Assistant        │           │
 * │     │   Live Chat           │ Coin      │
 * │     │                      │ Trust     │
 * └─────┴──────────────────────┴──────────┘
 *
 * Tablet: Nav collapses to icon-only sidebar
 * Mobile: Full-width stacked
 */
export function MissionOs({ data, className }: MissionOsProps) {
  return (
    <div className={cn("relative flex min-h-screen flex-col", className)}>
      {/* Main content area */}
      <div className="flex flex-1">
        {/* ── Left Navigation (hidden on very small screens, collapsible) ── */}
        <aside className="hidden w-56 shrink-0 md:block">
          <LeftNavigation
            sections={data.navSections}
            activeItemId={data.activeNavItemId}
            className="h-full"
          />
        </aside>

        {/* ── Main Center Content ── */}
        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6 lg:p-8">
          <MissionCenter data={data.missionCenter} />
          <EvidenceWorkspace items={data.evidence} />
          <AiAssistantPlaceholder />

          {/* Mobile-only: chat, timeline, activity, coin, trust (hidden on desktop - they're in sidebar) */}
          <div className="space-y-5 lg:hidden">
            <LiveChatPlaceholder />
            <MissionTimeline events={data.timeline} />
            <MissionActivity items={data.activity} />
            <CoinPanel data={data.coinPanel} />
            <TrustPanel scouts={data.scouts} verifiers={data.verifiers} />
          </div>
        </main>

        {/* ── Right Panel (desktop only) ── */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 lg:block xl:w-80">
          <div className="space-y-5">
            <LiveChatPlaceholder />
            <MissionTimeline events={data.timeline} />
            <MissionActivity items={data.activity} />
            <CoinPanel data={data.coinPanel} />
            <TrustPanel scouts={data.scouts} verifiers={data.verifiers} />
          </div>
        </aside>
      </div>

      {/* ── Sticky Action Bar ── */}
      <StickyActionBar
        missionId={data.missionCenter.id}
        missionTitle={data.missionCenter.title}
        bountyAmount={data.coinPanel.currentBounty}
        scoutCount={data.missionCenter.assignedScouts.length}
        status={
          data.missionCenter.status as
            "open" | "in_progress" | "submitted" | "verified" | "completed"
        }
      />
    </div>
  );
}
