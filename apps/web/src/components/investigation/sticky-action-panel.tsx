"use client";

import Link from "next/link";
import { Button, cn } from "@scoutx/ui";
import { WatchButton } from "./watch-button";

/* ─── Types ─── */

interface StickyActionPanelProps {
  /** Investigation ID for the CTA link */
  investigationId: string;
  /** Investigation title for aria-label */
  investigationTitle: string;
  /** Current bounty amount in whole coins */
  bountyAmount: number;
  /** Whether the user is already on this investigation */
  className?: string;
}

/* ─── Component ─── */

/**
 * StickyActionPanel is a fixed bottom bar on mobile, inline on desktop.
 * It contains the primary CTA ("Join Investigation"), the Track Case button,
 * and the current bounty amount.
 *
 * Behaviour:
 * - Mobile: fixed to bottom of viewport, full width
 * - Desktop: sticky to bottom of the sidebar / content area
 */
export function StickyActionPanel({
  investigationId,
  investigationTitle,
  bountyAmount,
  className,
}: StickyActionPanelProps) {
  return (
    <div
      className={cn(
        // Mobile: fixed at bottom
        "fixed bottom-0 left-0 right-0 z-40 md:sticky md:bottom-0",
        "bg-[var(--scoutx-card)]/95 border-t border-[var(--scoutx-border)] backdrop-blur-md",
        "px-4 py-3 md:px-0 md:py-4",
        className,
      )}
      role="toolbar"
      aria-label={`Actions for ${investigationTitle}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 md:flex-col md:gap-3">
        {/* Bounty display */}
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--scoutx-muted-foreground)]">
            Current Bounty
          </span>
          <span className="font-display text-xl font-bold text-[var(--scoutx-primary)]">
            {bountyAmount.toLocaleString()} ⛭
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:w-full md:flex-col">
          <WatchButton className="md:w-full md:justify-center" />
          <Button size="sm" className="md:w-full md:justify-center" asChild>
            <Link href={`/investigation/${investigationId}/join`}>
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
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
