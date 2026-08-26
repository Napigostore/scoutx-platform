"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";
import { Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface LiveFeedItem {
  id: string;
  /** Type of activity */
  type: "scout_joined" | "evidence" | "verify" | "coin" | "trust" | "created" | "update";
  /** One-line summary */
  summary: string;
  /** Actor performing the action */
  actor: string;
  /** ISO timestamp */
  timestamp: string;
  /** Optional bounty amount (in whole coins) */
  bounty?: number;
}

interface LiveFeedProps {
  items: LiveFeedItem[];
  className?: string;
}

const TYPE_CONFIG = {
  scout_joined: { icon: "👤", label: "Scout", color: "text-[var(--scoutx-primary)]" },
  evidence: { icon: "📷", label: "Evidence", color: "text-[var(--scoutx-success)]" },
  verify: { icon: "✓", label: "Verify", color: "text-[var(--scoutx-warning)]" },
  coin: { icon: "⛭", label: "Coin", color: "text-[var(--scoutx-warning)]" },
  trust: { icon: "★", label: "Trust", color: "text-[var(--scoutx-primary)]" },
  created: { icon: "🆕", label: "New", color: "text-[var(--scoutx-success)]" },
  update: { icon: "⟳", label: "Update", color: "text-[var(--scoutx-muted-foreground)]" },
} as const;

/**
 * LiveFeed renders a scrolling, auto-updating feed of real-time
 * intelligence activity across the ScoutX marketplace.
 * Items animate in with staggered delays.
 */
export function LiveFeed({ items, className }: LiveFeedProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Live Feed
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
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No live activity
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Real-time intelligence will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-success)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--scoutx-success)]" />
          </span>
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
            Live Feed
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
          {items.length} event{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Feed items */}
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.03 * idx, ease: [0.22, 1, 0.36, 1] }}
              className="hover:bg-[var(--scoutx-muted)]/30 flex items-start gap-2.5 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2 transition-colors"
            >
              {/* Type icon */}
              <span className={cn("mt-0.5 shrink-0 text-xs", cfg.color)} aria-hidden="true">
                {cfg.icon}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--scoutx-foreground)]">{item.summary}</p>
                <p className="flex items-center gap-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
                  <span className="font-medium">{item.actor}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.timestamp}>{item.timestamp}</time>
                </p>
              </div>

              {/* Optional bounty */}
              {item.bounty != null && (
                <span className="font-display shrink-0 text-xs font-bold text-[var(--scoutx-primary)]">
                  +{item.bounty.toLocaleString()} ⛭
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
