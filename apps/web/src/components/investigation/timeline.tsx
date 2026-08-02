"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface TimelineEvent {
  id: string;
  type: "created" | "evidence" | "update" | "verify" | "note" | "scout_joined";
  summary: string;
  detail?: string;
  actor: string;
  timestamp: string;
}

const EVENT_ICONS: Record<TimelineEvent["type"], string> = {
  created: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  evidence:
    "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
  update:
    "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182",
  verify: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  note: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501A12.435 12.435 0 0012 21c2.107 0 4.106-.523 5.848-1.444.193-.29.513-.474.863-.5a31.448 31.448 0 003.424-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  scout_joined:
    "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
} as const;

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  created: "bg-[var(--scoutx-primary)]",
  evidence: "bg-[var(--scoutx-success)]",
  update: "bg-[var(--scoutx-warning)]",
  verify: "bg-[var(--scoutx-success)]",
  note: "bg-[var(--scoutx-accent)]",
  scout_joined: "bg-[var(--scoutx-muted-foreground)]",
} as const;

/* ─── Component ─── */

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

/**
 * Timeline displays investigation activity as a vertical list with
 * dot markers, icons, and metadata. Most recent events appear first.
 * Desktop: larger spacing. Mobile: compact.
 */
export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Timeline
        </h3>
        <p className="text-sm text-[var(--scoutx-muted-foreground)]">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Timeline
      </h3>

      <ol className="relative ml-2 space-y-0 border-l border-[var(--scoutx-border)]" role="list">
        {events.map((event, idx) => (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.03 * idx, ease: [0.22, 1, 0.36, 1] }}
            className="relative pb-4 pl-6 last:pb-0"
          >
            {/* Dot */}
            <span
              className={cn(
                "absolute left-0 top-1 z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full ring-2 ring-[var(--scoutx-background)]",
                EVENT_COLORS[event.type],
              )}
              aria-hidden="true"
            />

            {/* Content */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-3 w-3 shrink-0 text-[var(--scoutx-muted-foreground)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={EVENT_ICONS[event.type]} />
                </svg>
                <p className="text-xs font-medium text-[var(--scoutx-foreground)]">
                  {event.summary}
                </p>
              </div>
              {event.detail && (
                <p className="text-[11px] leading-relaxed text-[var(--scoutx-muted-foreground)]">
                  {event.detail}
                </p>
              )}
              <div className="flex items-center gap-2 text-[10px] text-[var(--scoutx-muted-foreground)]">
                <span>{event.actor}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={event.timestamp}>{event.timestamp}</time>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
