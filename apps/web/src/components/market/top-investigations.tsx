"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface TopInvestigationItem {
  id: string;
  title: string;
  category: string;
  location: string;
  bounty: number;
  status: "hot" | "active" | "open";
  scoutCount: number;
}

interface TopInvestigationsProps {
  items: TopInvestigationItem[];
  className?: string;
}

const STATUS_CONFIG = {
  hot: {
    label: "Hot",
    badgeVariant: "outline" as const,
    dotColor: "bg-[var(--scoutx-destructive)]",
  },
  active: {
    label: "Active",
    badgeVariant: "secondary" as const,
    dotColor: "bg-[var(--scoutx-primary)]",
  },
  open: {
    label: "Open",
    badgeVariant: "outline" as const,
    dotColor: "bg-[var(--scoutx-muted-foreground)]",
  },
} as const;

/**
 * TopInvestigations shows the highest-bounty or most active investigations
 * in a ranked list, linking to each investigation page.
 */
export function TopInvestigations({ items, className }: TopInvestigationsProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Top Investigations
        </h3>
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] py-8 text-center">
          <svg
            className="h-6 w-6 text-[var(--scoutx-muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No investigations
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Top investigations will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Top Investigations
      </h3>

      <div className="space-y-2">
        {items.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * idx, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/investigation/${item.id}`}
                className="hover:bg-[var(--scoutx-muted)]/30 group block rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Rank + title */}
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] font-bold tabular-nums text-[var(--scoutx-muted-foreground)]">
                        #{idx + 1}
                      </span>
                      <p className="truncate text-sm font-medium text-[var(--scoutx-foreground)] transition-colors group-hover:text-[var(--scoutx-primary)]">
                        {item.title}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
                      <span className="inline-flex items-center gap-0.5">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {item.location}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.scoutCount} scout{item.scoutCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Right side: bounty + status */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display text-sm font-bold text-[var(--scoutx-primary)]">
                      {item.bounty.toLocaleString()} ⛭
                    </span>
                    <Badge
                      variant={cfg.badgeVariant}
                      className="flex items-center gap-1 text-[9px] uppercase tracking-wider"
                    >
                      <span
                        className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dotColor)}
                        aria-hidden="true"
                      />
                      {cfg.label}
                    </Badge>
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
