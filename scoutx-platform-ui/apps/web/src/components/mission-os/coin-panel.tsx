"use client";

import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface CoinPanelData {
  /** Current bounty in whole coins */
  currentBounty: number;
  /** Initial bounty */
  initialBounty: number;
  /** Maximum cap */
  maxCap: number;
  /** Escalation amount per interval */
  escalationAmount: number;
  /** Escalation interval label */
  escalationLabel: string;
  /** Is escalation active? */
  escalationActive: boolean;
  /** Total coins earned by assigned scouts */
  totalEarned: number;
  /** Recent transactions (last 3-5) */
  recentTransactions: CoinTransaction[];
}

export interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  actor: string;
  timestamp: string;
}

interface CoinPanelProps {
  data: CoinPanelData;
  className?: string;
}

/**
 * CoinPanel shows the live bounty state for a mission:
 * current amount, escalation status, cap, and recent transactions.
 */
export function CoinPanel({ data, className }: CoinPanelProps) {
  const progressPercent = Math.min((data.currentBounty / data.maxCap) * 100, 100);

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Bounty
      </h3>

      <div className="rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3">
        {/* Current bounty */}
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-bold tracking-tight text-[var(--scoutx-foreground)]">
            {data.currentBounty.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-[var(--scoutx-primary)]">⛭</span>
          </span>
          <Badge
            variant={data.escalationActive ? "success" : "secondary"}
            className="text-[8px] uppercase tracking-wider"
          >
            {data.escalationActive ? "Escalating" : "Paused"}
          </Badge>
        </div>

        {/* Escalation info */}
        <p className="mt-0.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
          {data.escalationActive
            ? `+${data.escalationAmount} ⛭ every ${data.escalationLabel}`
            : `Escalation paused — cap at ${data.maxCap.toLocaleString()} ⛭`}
        </p>

        {/* Progress bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[9px] text-[var(--scoutx-muted-foreground)]">
            <span>{data.initialBounty.toLocaleString()} ⛭</span>
            <span>{data.maxCap.toLocaleString()} ⛭ cap</span>
          </div>
          <div className="bg-[var(--scoutx-muted)]/30 mt-1 h-1.5 overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full bg-[var(--scoutx-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Total earned */}
        <div className="bg-[var(--scoutx-success)]/5 mt-2.5 flex items-center justify-between rounded-[var(--scoutx-radius-sm)] px-2 py-1.5">
          <span className="text-[10px] text-[var(--scoutx-muted-foreground)]">
            Total earned by scouts
          </span>
          <span className="font-display text-xs font-bold text-[var(--scoutx-success)]">
            +{data.totalEarned.toLocaleString()} ⛭
          </span>
        </div>

        {/* Recent transactions */}
        {data.recentTransactions.length > 0 && (
          <div className="mt-2.5 space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--scoutx-muted-foreground)]">
              Recent
            </p>
            {data.recentTransactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.03 * idx }}
                className="hover:bg-[var(--scoutx-muted)]/20 flex items-center justify-between rounded-[var(--scoutx-radius-sm)] px-1.5 py-1"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] text-[var(--scoutx-foreground)]">
                    {tx.reason}
                  </p>
                  <p className="text-[8px] text-[var(--scoutx-muted-foreground)]">
                    {tx.actor} · {tx.timestamp}
                  </p>
                </div>
                <span
                  className={cn(
                    "font-display shrink-0 text-[10px] font-bold",
                    tx.amount >= 0
                      ? "text-[var(--scoutx-success)]"
                      : "text-[var(--scoutx-destructive)]",
                  )}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount} ⛭
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
