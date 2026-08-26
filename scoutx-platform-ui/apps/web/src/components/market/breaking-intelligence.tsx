"use client";

import { motion } from "framer-motion";
import { Badge, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface BreakingIntelItem {
  id: string;
  title: string;
  location: string;
  category: string;
  /** Urgency level */
  urgency: "critical" | "high" | "medium";
  /** ISO timestamp */
  timestamp: string;
  /** Bounty in whole coins */
  bounty: number;
}

interface BreakingIntelligenceProps {
  items: BreakingIntelItem[];
  className?: string;
}

const URGENCY_CONFIG = {
  critical: {
    label: "Critical",
    dotColor: "bg-[var(--scoutx-destructive)]",
    barColor: "bg-[var(--scoutx-destructive)]",
    badgeVariant: "outline" as const,
  },
  high: {
    label: "High",
    dotColor: "bg-[var(--scoutx-warning)]",
    barColor: "bg-[var(--scoutx-warning)]",
    badgeVariant: "outline" as const,
  },
  medium: {
    label: "Medium",
    dotColor: "bg-[var(--scoutx-primary)]",
    barColor: "bg-[var(--scoutx-primary)]",
    badgeVariant: "outline" as const,
  },
} as const;

/**
 * BreakingIntelligence displays urgent high-priority intelligence items
 * with a red/warning accent, pulsing live indicator, and urgency badges.
 */
export function BreakingIntelligence({ items, className }: BreakingIntelligenceProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Breaking Intelligence
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No breaking intel
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Urgent intelligence will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-destructive)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--scoutx-destructive)]" />
          </span>
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
            Breaking Intelligence
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
          {items.length} alert{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const cfg = URGENCY_CONFIG[item.urgency];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * idx, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "group relative overflow-hidden rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3",
                item.urgency === "critical" && "border-[var(--scoutx-destructive)]/20",
                "hover:bg-[var(--scoutx-muted)]/30 transition-colors",
              )}
            >
              {/* Urgency bar */}
              <div
                className={cn("absolute left-0 top-0 h-full w-0.5", cfg.barColor)}
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dotColor)}
                      aria-hidden="true"
                    />
                    <p className="truncate text-sm font-medium text-[var(--scoutx-foreground)]">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--scoutx-muted-foreground)]">
                    <span>{item.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={item.timestamp}>{item.timestamp}</time>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge
                    variant={cfg.badgeVariant}
                    className={cn(
                      "text-[9px] uppercase tracking-wider",
                      item.urgency === "critical" &&
                        "border-[var(--scoutx-destructive)]/30 text-[var(--scoutx-destructive)]",
                    )}
                  >
                    {cfg.label}
                  </Badge>
                  <span className="font-display text-xs font-bold text-[var(--scoutx-primary)]">
                    {item.bounty.toLocaleString()} ⛭
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
