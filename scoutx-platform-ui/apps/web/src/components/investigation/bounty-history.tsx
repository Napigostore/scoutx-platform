"use client";

import { motion } from "framer-motion";
import { Card, CardContent, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface BountyHistoryEntry {
  id: string;
  /** Amount in whole coins */
  amount: number;
  /** What triggered this change */
  reason: string;
  /** Actor or system event that caused the change */
  triggeredBy: string;
  /** ISO date string */
  timestamp: string;
}

interface BountyHistoryProps {
  entries: BountyHistoryEntry[];
  /** The current bounty amount */
  currentAmount: number;
  className?: string;
}

/* ─── Component ─── */

/**
 * BountyHistory shows the progression of bounty rewards over time,
 * including escalation events, caps, and adjustments.
 */
export function BountyHistory({ entries, currentAmount, className }: BountyHistoryProps) {
  if (entries.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <svg
            className="h-8 w-8 text-[var(--scoutx-muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No bounty history
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Changes to the bounty reward will be tracked here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Bounty History
        </h3>
        <span className="font-display text-sm font-bold text-[var(--scoutx-primary)]">
          {currentAmount.toLocaleString()} ⛭
        </span>
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        {entries.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2"
          >
            {/* Coin icon */}
            <svg
              className="h-5 w-5 shrink-0 text-[var(--scoutx-warning)]"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v.54c-.618.154-1.206.434-1.647.875a2.5 2.5 0 103.534 3.534l.182-.181a1 1 0 10-1.415-1.415l-.182.182a.5.5 0 11-.707-.708l.182-.182A2.5 2.5 0 0011 6.54V6z" />
            </svg>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--scoutx-foreground)]">{entry.reason}</p>
              <p className="flex items-center gap-2 text-[10px] text-[var(--scoutx-muted-foreground)]">
                <span>{entry.triggeredBy}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={entry.timestamp}>{entry.timestamp}</time>
              </p>
            </div>

            {/* Amount change */}
            <span
              className={cn(
                "font-display shrink-0 text-sm font-bold tabular-nums",
                entry.amount >= 0
                  ? "text-[var(--scoutx-success)]"
                  : "text-[var(--scoutx-destructive)]",
              )}
            >
              {entry.amount >= 0 ? "+" : ""}
              {entry.amount.toLocaleString()} ⛭
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
