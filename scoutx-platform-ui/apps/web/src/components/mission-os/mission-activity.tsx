"use client";

import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface MissionActivityItem {
  id: string;
  type: "scout_moved" | "evidence_uploaded" | "status_change" | "coin_event" | "verifier_action";
  summary: string;
  actor: string;
  timestamp: string;
}

interface MissionActivityProps {
  items: MissionActivityItem[];
  className?: string;
}

const TYPE_CONFIG = {
  scout_moved: { icon: "●", label: "Movement", color: "bg-[var(--scoutx-success)]" },
  evidence_uploaded: { icon: "▣", label: "Upload", color: "bg-[var(--scoutx-warning)]" },
  status_change: { icon: "◆", label: "Status", color: "bg-[var(--scoutx-primary)]" },
  coin_event: { icon: "⛭", label: "Coin", color: "bg-[var(--scoutx-warning)]" },
  verifier_action: { icon: "✓", label: "Verify", color: "bg-[var(--scoutx-primary)]" },
} as const;

/**
 * MissionActivity shows a compact, streaming feed of live actions
 * during a mission — scout movements, uploads, status transitions.
 */
export function MissionActivity({ items, className }: MissionActivityProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Activity
        </h3>
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] py-6 text-center">
          <svg
            className="h-5 w-5 text-[var(--scoutx-muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5"
            />
          </svg>
          <p className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">No activity</p>
          <p className="text-[10px] text-[var(--scoutx-muted-foreground)]">
            Live activity will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-success)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--scoutx-success)]" />
          </span>
          <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
            Activity
          </h3>
        </div>
        <Badge variant="outline" className="text-[8px] uppercase tracking-wider">
          Live
        </Badge>
      </div>

      <div className="space-y-1">
        {items.map((item, idx) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.03 * idx, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-2.5 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-2.5 py-2"
            >
              {/* Type dot */}
              <span
                className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", cfg.color)}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--scoutx-foreground)]">{item.summary}</p>
                <p className="flex items-center gap-1 text-[9px] text-[var(--scoutx-muted-foreground)]">
                  <span className="font-medium">{item.actor}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.timestamp}>{item.timestamp}</time>
                </p>
              </div>

              {/* Type label */}
              <Badge variant="secondary" className="shrink-0 text-[7px] uppercase tracking-wider">
                {cfg.label}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
