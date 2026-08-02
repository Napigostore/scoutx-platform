"use client";

import { motion } from "framer-motion";
import { Card, CardContent, Badge, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface VerificationItem {
  id: string;
  /** What is being verified */
  label: string;
  /** Current verification status */
  status: "pending" | "verified" | "disputed" | "failed";
  /** How many scouts have verified this */
  verifierCount: number;
  /** Minimum verifiers needed */
  threshold: number;
  /** Optional note about the verification */
  note?: string;
}

interface VerificationPanelProps {
  items: VerificationItem[];
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    variant: "outline" as const,
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  verified: {
    label: "Verified",
    variant: "success" as const,
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  disputed: {
    label: "Disputed",
    variant: "warning" as const,
    icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  },
  failed: {
    label: "Failed",
    variant: "outline" as const,
    icon: "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
} as const;

/* ─── Component ─── */

/**
 * VerificationPanel shows a checklist of items that require scout
 * verification. Each item has a status, verifier count vs threshold,
 * and optional notes.
 */
export function VerificationPanel({ items, className }: VerificationPanelProps) {
  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const totalCount = items.length;

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <svg
            className="h-8 w-8 text-[var(--scoutx-muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No verification items
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Verification criteria will appear once established
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header with progress */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Verification
        </h3>
        <span className="text-xs tabular-nums text-[var(--scoutx-muted-foreground)]">
          {verifiedCount}/{totalCount} verified
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--scoutx-muted)]"
        role="progressbar"
        aria-valuenow={verifiedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label="Verification progress"
      >
        <motion.div
          className="h-full rounded-full bg-[var(--scoutx-success)]"
          initial={{ width: 0 }}
          animate={{ width: `${(verifiedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex items-start gap-3 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3",
                item.status === "verified" && "border-[var(--scoutx-success)]/20",
                item.status === "disputed" && "border-[var(--scoutx-warning)]/20",
              )}
            >
              {/* Icon */}
              <svg
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  item.status === "verified" && "text-[var(--scoutx-success)]",
                  item.status === "disputed" && "text-[var(--scoutx-warning)]",
                  item.status === "failed" && "text-[var(--scoutx-destructive)]",
                  item.status === "pending" && "text-[var(--scoutx-muted-foreground)]",
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
              </svg>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--scoutx-foreground)]">
                    {item.label}
                  </span>
                  <Badge variant={cfg.variant} className="text-[9px] uppercase tracking-wider">
                    {cfg.label}
                  </Badge>
                </div>

                {/* Verifier count */}
                <div className="flex items-center gap-1 text-xs text-[var(--scoutx-muted-foreground)]">
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
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                  <span>
                    {item.verifierCount}/{item.threshold} verifiers
                  </span>
                </div>

                {/* Note */}
                {item.note && (
                  <p className="text-[11px] italic leading-relaxed text-[var(--scoutx-muted-foreground)]">
                    {item.note}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
