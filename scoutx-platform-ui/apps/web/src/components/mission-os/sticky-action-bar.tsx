"use client";

import { cn, Button } from "@scoutx/ui";
import { WatchButton } from "@/components/investigation/watch-button";

/* ─── Types ─── */

interface StickyActionBarProps {
  /** Mission ID */
  missionId: string;
  /** Mission title */
  missionTitle: string;
  /** Current bounty in whole coins */
  bountyAmount: number;
  /** Total scouts assigned */
  scoutCount: number;
  /** Mission status */
  status: "open" | "in_progress" | "submitted" | "verified" | "completed";
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open for Scouts",
  in_progress: "In Progress",
  submitted: "Pending Review",
  verified: "Verified",
  completed: "Completed",
};

/**
 * StickyActionBar is a persistent bottom bar showing mission
 * summary info and primary actions: Track Case, Join Investigation,
 * view status. Fixed on mobile, inline on desktop.
 */
export function StickyActionBar({
  missionId: _missionId,
  missionTitle,
  bountyAmount,
  scoutCount,
  status,
  className,
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--scoutx-border)] bg-[color-mix(in_srgb,var(--scoutx-background)_92%,white)] backdrop-blur-md lg:sticky lg:bottom-auto",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[var(--scoutx-foreground)]">
            {missionTitle}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-[var(--scoutx-muted-foreground)]">
            <span className="font-display font-bold text-[var(--scoutx-primary)]">
              {bountyAmount.toLocaleString()} ⛭
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {scoutCount} scout{scoutCount !== 1 ? "s" : ""}
            </span>
            <span aria-hidden="true">·</span>
            <span>{STATUS_LABELS[status] ?? status}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <WatchButton />
          <Button size="sm" className="text-xs">
            Join Investigation
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
