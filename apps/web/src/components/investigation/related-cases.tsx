"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, Badge, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface RelatedCase {
  id: string;
  title: string;
  category: string;
  location: string;
  /** Bounty amount in whole coins */
  bountyAmount: number;
  status: "open" | "active" | "resolved" | "closed";
  matchReason: string;
}

interface RelatedCasesProps {
  cases: RelatedCase[];
  className?: string;
}

const STATUS_CONFIG = {
  open: { label: "Open", variant: "default" as const },
  active: { label: "Active", variant: "success" as const },
  resolved: { label: "Resolved", variant: "secondary" as const },
  closed: { label: "Closed", variant: "outline" as const },
} as const;

/* ─── Component ─── */

/**
 * RelatedCases displays a list of cases related to the current investigation,
 * with match reasons and quick navigation.
 */
export function RelatedCases({ cases, className }: RelatedCasesProps) {
  if (cases.length === 0) {
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
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No related cases
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Similar investigations will appear here as the network grows
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Related Cases
      </h3>

      <div className="space-y-2">
        {cases.map((c, idx) => {
          const cfg = STATUS_CONFIG[c.status];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/investigation/${c.id}`}
                className={cn(
                  "group block rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3",
                  "hover:border-[var(--scoutx-primary)]/30 hover:bg-[var(--scoutx-muted)]/30 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-[var(--scoutx-foreground)] transition-colors group-hover:text-[var(--scoutx-primary)]">
                      {c.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--scoutx-muted-foreground)]">
                      <span>{c.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{c.location}</span>
                    </div>
                    <p className="flex items-center gap-1 text-[10px] text-[var(--scoutx-muted-foreground)]">
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {c.matchReason}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={cfg.variant} className="text-[9px] uppercase tracking-wider">
                      {cfg.label}
                    </Badge>
                    <span className="font-display text-sm font-bold text-[var(--scoutx-primary)]">
                      {c.bountyAmount.toLocaleString()} ⛭
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
