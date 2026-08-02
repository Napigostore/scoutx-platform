"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface MarketStat {
  key: string;
  label: string;
  value: number;
  /** Format: "coins", "count", "percentage" */
  format: "coins" | "count" | "percentage";
  /** Optional delta (positive = up, negative = down) */
  delta?: number;
}

interface MarketStatsProps {
  stats: MarketStat[];
  className?: string;
}

/**
 * MarketStats displays key aggregate platform metrics in a
 * compact grid: active investigations, scouts online, coins in circulation,
 * verification rate, etc.
 */
export function MarketStats({ stats, className }: MarketStatsProps) {
  if (stats.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Market Stats
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
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No market stats
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Market statistics will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Market Stats
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * idx, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3"
          >
            {/* Label */}
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--scoutx-muted-foreground)]">
              {stat.label}
            </p>

            {/* Value */}
            <p className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold tracking-tight text-[var(--scoutx-foreground)]">
                {stat.format === "coins"
                  ? `${stat.value.toLocaleString()}\u00A0⛭`
                  : stat.format === "percentage"
                    ? `${stat.value}%`
                    : stat.value.toLocaleString()}
              </span>
            </p>

            {/* Delta */}
            {stat.delta != null && stat.delta !== 0 && (
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-0.5 text-[10px] font-medium",
                  stat.delta > 0
                    ? "text-[var(--scoutx-success)]"
                    : "text-[var(--scoutx-destructive)]",
                )}
              >
                <svg
                  className={cn("h-2.5 w-2.5", stat.delta < 0 && "rotate-180")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19V5m0 0l-7 7m7-7l7 7"
                  />
                </svg>
                {stat.delta > 0 ? "+" : ""}
                {stat.delta.toLocaleString()}%
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
