"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface CoinActivityItem {
  id: string;
  /** Username or actor */
  actor: string;
  /** Reason for coin movement */
  reason: string;
  /** Amount in whole coins (positive = earned, negative = spent) */
  amount: number;
  /** ISO timestamp */
  timestamp: string;
}

interface CoinActivityProps {
  items: CoinActivityItem[];
  className?: string;
}

/**
 * CoinActivity shows recent coin earnings, bounties paid out,
 * and marketplace coin movement.
 */
export function CoinActivity({ items, className }: CoinActivityProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Coin Activity
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
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No coin activity
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Recent coin movements will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Coin Activity
      </h3>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2"
          >
            {/* Coin icon */}
            <svg
              className="h-4 w-4 shrink-0 text-[var(--scoutx-warning)]"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v.54c-.618.154-1.206.434-1.647.875a2.5 2.5 0 103.534 3.534l.182-.181a1 1 0 10-1.415-1.415l-.182.182a.5.5 0 11-.707-.708l.182-.182A2.5 2.5 0 0011 6.54V6z" />
            </svg>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--scoutx-foreground)]">
                <span className="font-medium">{item.actor}</span>{" "}
                {item.amount >= 0 ? "earned" : "spent"} — {item.reason}
              </p>
              <p className="text-[10px] text-[var(--scoutx-muted-foreground)]">
                <time dateTime={item.timestamp}>{item.timestamp}</time>
              </p>
            </div>

            {/* Amount */}
            <span
              className={cn(
                "font-display shrink-0 text-sm font-bold tabular-nums",
                item.amount >= 0
                  ? "text-[var(--scoutx-success)]"
                  : "text-[var(--scoutx-destructive)]",
              )}
            >
              {item.amount >= 0 ? "+" : ""}
              {item.amount.toLocaleString()} ⛭
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
