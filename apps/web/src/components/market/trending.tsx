"use client";

import { motion } from "framer-motion";
import { Badge, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface TrendingItem {
  id: string;
  label: string;
  /** Category name */
  category: string;
  /** Delta in the last interval (positive = rising) */
  delta: number;
  /** Total count or volume */
  volume: number;
}

interface TrendingProps {
  items: TrendingItem[];
  className?: string;
}

/**
 * Trending shows currently trending topics, categories, and investigations
 * ranked by recent momentum/delta.
 */
export function Trending({ items, className }: TrendingProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Trending
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
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No trending items
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Trending intelligence will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Trending
      </h3>

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const isRising = item.delta > 0;
          const isFlat = item.delta === 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2"
            >
              {/* Rank */}
              <span className="font-display text-[10px] font-bold tabular-nums text-[var(--scoutx-muted-foreground)]">
                #{idx + 1}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-[var(--scoutx-foreground)]">
                    {item.label}
                  </p>
                  <Badge variant="secondary" className="text-[8px] uppercase tracking-wider">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-[10px] text-[var(--scoutx-muted-foreground)]">
                  {item.volume.toLocaleString()} reports
                </p>
              </div>

              {/* Delta indicator */}
              <div
                className={cn(
                  "flex shrink-0 items-center gap-1",
                  isRising && "text-[var(--scoutx-success)]",
                  !isRising && !isFlat && "text-[var(--scoutx-destructive)]",
                  isFlat && "text-[var(--scoutx-muted-foreground)]",
                )}
              >
                <svg
                  className={cn(
                    "h-3 w-3",
                    isRising && "",
                    !isRising && !isFlat && "rotate-180",
                    isFlat && "opacity-40",
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19V5m0 0l-7 7m7-7l7 7"
                  />
                </svg>
                <span className="font-display text-sm font-bold tabular-nums">
                  {isRising ? "+" : ""}
                  {item.delta.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
