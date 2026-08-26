"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";

interface HeatMapPlaceholderProps {
  className?: string;
}

/**
 * HeatMapPlaceholder renders a visual placeholder for the
 * geographic intelligence heat map. Displays a stylized
 * grid with heat patterns to convey the eventual map feature.
 */
export function HeatMapPlaceholder({ className }: HeatMapPlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)]",
        className,
      )}
      aria-label="Geographic intelligence heat map — coming soon"
    >
      {/* Title */}
      <div className="p-4 pb-2">
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Intelligence Heat Map
        </h3>
      </div>

      {/* Map placeholder */}
      <div className="border-[var(--scoutx-border)]/50 bg-[var(--scoutx-muted)]/20 relative mx-4 mb-4 overflow-hidden rounded-[var(--scoutx-radius-md)] border">
        {/* Dummy grid pattern */}
        <svg
          className="h-48 w-full"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="var(--scoutx-border)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
            {/* Gradient for heat spots */}
            <radialGradient id="hotspot1" cx="30%" cy="40%" r="25%">
              <stop offset="0%" stopColor="var(--scoutx-destructive)" stopOpacity="0.25" />
              <stop offset="50%" stopColor="var(--scoutx-destructive)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hotspot2" cx="65%" cy="30%" r="20%">
              <stop offset="0%" stopColor="var(--scoutx-warning)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="var(--scoutx-warning)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hotspot3" cx="50%" cy="70%" r="15%">
              <stop offset="0%" stopColor="var(--scoutx-primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hotspot4" cx="80%" cy="65%" r="18%">
              <stop offset="0%" stopColor="var(--scoutx-success)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid */}
          <rect width="400" height="200" fill="url(#grid)" />

          {/* Heat spots */}
          <rect width="400" height="200" fill="url(#hotspot1)" />
          <rect width="400" height="200" fill="url(#hotspot2)" />
          <rect width="400" height="200" fill="url(#hotspot3)" />
          <rect width="400" height="200" fill="url(#hotspot4)" />

          {/* Dots representing investigations */}
          <motion.circle
            cx="120"
            cy="80"
            r="3"
            fill="var(--scoutx-destructive)"
            initial={{ opacity: 0.4, r: 2 }}
            animate={{ opacity: 1, r: 3 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.circle
            cx="260"
            cy="60"
            r="2.5"
            fill="var(--scoutx-warning)"
            initial={{ opacity: 0.5, r: 2 }}
            animate={{ opacity: 1, r: 2.5 }}
            transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
          />
          <motion.circle
            cx="200"
            cy="140"
            r="2"
            fill="var(--scoutx-primary)"
            initial={{ opacity: 0.4, r: 1.5 }}
            animate={{ opacity: 0.8, r: 2 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.4 }}
          />
          <motion.circle
            cx="320"
            cy="130"
            r="2"
            fill="var(--scoutx-success)"
            initial={{ opacity: 0.4, r: 1.5 }}
            animate={{ opacity: 0.8, r: 2 }}
            transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse", delay: 0.1 }}
          />
          <motion.circle
            cx="80"
            cy="150"
            r="1.5"
            fill="var(--scoutx-muted-foreground)"
            initial={{ opacity: 0.3, r: 1 }}
            animate={{ opacity: 0.6, r: 1.5 }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
          />
        </svg>

        {/* Overlay gradient */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--scoutx-card)] via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Coming soon label */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="bg-[var(--scoutx-card)]/80 rounded-full border border-[var(--scoutx-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--scoutx-muted-foreground)] backdrop-blur-sm">
            Live Map — Coming Soon
          </span>
        </div>
      </div>
    </motion.div>
  );
}
