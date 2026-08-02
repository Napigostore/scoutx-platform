"use client";

import { motion } from "framer-motion";
import { Badge, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface TrustActivityItem {
  id: string;
  /** Scout or requester name */
  actor: string;
  /** Action performed */
  action: "verified" | "disputed" | "endorsed" | "badge_earned";
  /** Target of the action */
  target: string;
  /** ISO timestamp */
  timestamp: string;
}

interface TrustActivityProps {
  items: TrustActivityItem[];
  className?: string;
}

const ACTION_CONFIG = {
  verified: { label: "Verified", badgeVariant: "success" as const },
  disputed: { label: "Disputed", badgeVariant: "warning" as const },
  endorsed: { label: "Endorsed", badgeVariant: "default" as const },
  badge_earned: { label: "Badge Earned", badgeVariant: "outline" as const },
} as const;

/**
 * TrustActivity shows recent trust events — verifications,
 * disputes, endorsements, and badge earnings.
 */
export function TrustActivity({ items, className }: TrustActivityProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Trust Activity
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
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No trust activity
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Trust events will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Trust Activity
      </h3>

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const cfg = ACTION_CONFIG[item.action];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2"
            >
              {/* Shield icon */}
              <svg
                className="h-4 w-4 shrink-0 text-[var(--scoutx-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--scoutx-foreground)]">
                  <span className="font-medium">{item.actor}</span>{" "}
                  {item.action === "badge_earned" ? "earned a badge:" : `${item.action}d:`}{" "}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="text-[10px] text-[var(--scoutx-muted-foreground)]">
                  <time dateTime={item.timestamp}>{item.timestamp}</time>
                </p>
              </div>

              {/* Badge */}
              <Badge
                variant={cfg.badgeVariant}
                className="shrink-0 text-[9px] uppercase tracking-wider"
              >
                {cfg.label}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
