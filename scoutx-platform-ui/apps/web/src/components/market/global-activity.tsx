"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface GlobalActivityItem {
  id: string;
  /** Location name */
  location: string;
  /** Activity description */
  summary: string;
  /** Activity type */
  type: "field_report" | "verification" | "coin_event" | "scout_milestone";
  /** ISO timestamp */
  timestamp: string;
}

interface GlobalActivityProps {
  items: GlobalActivityItem[];
  className?: string;
}

const TYPE_ICONS = {
  field_report: "📋",
  verification: "✓",
  coin_event: "⛭",
  scout_milestone: "🏆",
} as const;

/**
 * GlobalActivity displays a consolidated, map-like feed of
 * intelligence events from around the world.
 */
export function GlobalActivity({ items, className }: GlobalActivityProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Global Activity
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
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No global activity
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Worldwide intelligence will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Global Activity
      </h3>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.03 * idx, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-2.5 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2"
          >
            {/* Location dot */}
            <span className="mt-1 shrink-0 text-xs" aria-hidden="true">
              {TYPE_ICONS[item.type]}
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--scoutx-foreground)]">{item.summary}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <span className="font-medium">{item.location}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={item.timestamp}>{item.timestamp}</time>
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
