"use client";

import { cn } from "@scoutx/ui";
import { motion } from "framer-motion";

interface SocialProofBarProps {
  /** Live market status: "hot", "warm", or "cold" */
  marketStatus: "hot" | "warm" | "cold";
  /** Number of users watching this investigation */
  watcherCount: number;
  /** Number of nearby scouts online */
  nearbyScoutCount: number;
  /** Additional class names */
  className?: string;
}

const STATUS_CONFIG = {
  hot: {
    label: "Active Market",
    dotColor: "bg-[var(--scoutx-destructive)]",
    pulse: true,
    textColor: "text-[var(--scoutx-destructive)]",
  },
  warm: {
    label: "Emerging",
    dotColor: "bg-[var(--scoutx-warning)]",
    pulse: false,
    textColor: "text-[var(--scoutx-warning)]",
  },
  cold: {
    label: "Inactive",
    dotColor: "bg-[var(--scoutx-muted-foreground)]",
    pulse: false,
    textColor: "text-[var(--scoutx-muted-foreground)]",
  },
} as const;

/**
 * SocialProofBar displays live market status, watcher count, and nearby scouts.
 * Provides social proof to inform the user's decision to engage.
 */
export function SocialProofBar({
  marketStatus,
  watcherCount,
  nearbyScoutCount,
  className,
}: SocialProofBarProps) {
  const status = STATUS_CONFIG[marketStatus];

  return (
    <motion.div
      className={cn("flex flex-wrap items-center gap-4 text-xs", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Live market status */}
      <motion.span
        className={cn("flex items-center gap-1.5", status.textColor)}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            status.dotColor,
            status.pulse && "animate-pulse",
          )}
          aria-hidden="true"
        />
        <span className="font-medium" aria-label={`Market status: ${status.label}`}>
          {status.label}
        </span>
      </motion.span>

      {/* Watchers - animated counter */}
      <motion.span
        className="flex items-center gap-1.5 text-[var(--scoutx-muted-foreground)]"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <motion.span
          key={watcherCount}
          className="font-semibold tabular-nums text-[var(--scoutx-foreground)]"
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {watcherCount}
        </motion.span>
        <span>watching</span>
      </motion.span>

      {/* Nearby scouts */}
      <motion.span
        className="flex items-center gap-1.5 text-[var(--scoutx-muted-foreground)]"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <motion.span
          key={nearbyScoutCount}
          className="font-semibold tabular-nums text-[var(--scoutx-foreground)]"
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {nearbyScoutCount}
        </motion.span>
        <span>scouts nearby</span>
      </motion.span>
    </motion.div>
  );
}
