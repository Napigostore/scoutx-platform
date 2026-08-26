"use client";

import { Card, CardContent, cn } from "@scoutx/ui";
import { motion } from "framer-motion";

interface BountyCardProps {
  /** Current bounty amount in whole dollars */
  amount: number;
  /** Escalation amount per interval (optional) */
  escalationAmount?: number;
  /** Escalation interval label, e.g. "30 min" */
  escalationInterval?: string;
  /** Max cap for the bounty */
  maxCap?: number;
  /** Additional class names */
  className?: string;
}

/**
 * BountyCard displays the current investigation reward with escalation info.
 * Uses a prominent visual to convey urgency and value.
 * All amounts are shown in ScoutX coins (⛭).
 */
export function BountyCard({
  amount,
  escalationAmount,
  escalationInterval,
  maxCap,
  className,
}: BountyCardProps) {
  const hasEscalation = escalationAmount != null && escalationInterval != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        className={cn(
          "border-[var(--scoutx-primary)]/20 relative overflow-hidden",
          "from-[var(--scoutx-primary)]/5 bg-gradient-to-br to-transparent",
          className,
        )}
      >
        {/* Ambient glow */}
        <div
          className="bg-[var(--scoutx-primary)]/10 pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
          aria-hidden="true"
        />

        <CardContent className="flex flex-col gap-2 p-4">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--scoutx-muted-foreground)]">
            Bounty Reward
          </span>

          <div className="flex items-baseline gap-2">
            <motion.span
              className="font-display text-4xl font-bold tracking-tight text-[var(--scoutx-primary)]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {amount.toLocaleString()} ⛭
            </motion.span>
            {maxCap != null && (
              <span className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                cap {maxCap.toLocaleString()} ⛭
              </span>
            )}
          </div>

          {hasEscalation && (
            <motion.p
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--scoutx-warning)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-warning)] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--scoutx-warning)]" />
              </span>
              Escalating +{escalationAmount} ⛭ every {escalationInterval}
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
