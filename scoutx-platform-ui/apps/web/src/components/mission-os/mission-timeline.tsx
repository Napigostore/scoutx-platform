"use client";

import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface MissionTimelineEvent {
  id: string;
  type: "phase" | "scout" | "evidence" | "verify" | "coin" | "note";
  summary: string;
  detail: string;
  actor: string;
  timestamp: string;
  /** Optional coin amount */
  amount?: number;
}

interface MissionTimelineProps {
  events: MissionTimelineEvent[];
  className?: string;
}

const TYPE_CONFIG = {
  phase: { icon: "◆", color: "text-[var(--scoutx-primary)]", label: "Phase" },
  scout: { icon: "●", color: "text-[var(--scoutx-success)]", label: "Scout" },
  evidence: { icon: "▣", color: "text-[var(--scoutx-warning)]", label: "Evidence" },
  verify: { icon: "✓", color: "text-[var(--scoutx-primary)]", label: "Verify" },
  coin: { icon: "⛭", color: "text-[var(--scoutx-warning)]", label: "Coin" },
  note: { icon: "—", color: "text-[var(--scoutx-muted-foreground)]", label: "Note" },
} as const;

/**
 * MissionTimeline is a vertical timeline showing the sequence of events
 * in a mission's lifecycle. Events are connected by a continuous line.
 */
export function MissionTimeline({ events, className }: MissionTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Timeline
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
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
            No timeline events
          </p>
          <p className="text-[10px] text-[var(--scoutx-muted-foreground)]">
            Mission activity will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Timeline
        </h3>
        <Badge variant="outline" className="text-[8px] uppercase tracking-wider">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="relative pl-5">
        {/* Vertical connecting line */}
        <div
          className="absolute bottom-0 left-[7px] top-2 w-px bg-[var(--scoutx-border)]"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {events.map((event, idx) => {
            const cfg = TYPE_CONFIG[event.type];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute -left-5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[var(--scoutx-card)]",
                    cfg.color
                      .replace("text-", "bg-")
                      .replace("primary", "primary/30")
                      .replace("warning", "warning/30")
                      .replace("success", "success/30")
                      .replace("muted-foreground", "muted/30"),
                  )}
                  aria-hidden="true"
                >
                  <div
                    className={cn("h-1.5 w-1.5 rounded-full", cfg.color.replace("text-", "bg-"))}
                  />
                </div>

                {/* Content */}
                <div className="hover:bg-[var(--scoutx-muted)]/20 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-2.5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-[var(--scoutx-foreground)]">
                      {event.summary}
                    </p>
                    {event.amount != null && (
                      <span className="font-display shrink-0 text-xs font-bold text-[var(--scoutx-primary)]">
                        +{event.amount} ⛭
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
                    {event.detail}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] text-[var(--scoutx-muted-foreground)]">
                    <span className="text-[var(--scoutx-foreground)]/70 font-medium">
                      {event.actor}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={event.timestamp}>{event.timestamp}</time>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
