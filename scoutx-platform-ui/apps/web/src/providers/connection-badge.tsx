"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@scoutx/ui";
import type { ConnectionStatus } from "./realtime-types";

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; dotClass: string }> = {
  connecting: { label: "Connecting...", dotClass: "bg-[var(--scoutx-warning)] animate-pulse" },
  live: { label: "Live", dotClass: "bg-[var(--scoutx-success)]" },
  reconnecting: { label: "Reconnecting...", dotClass: "bg-[var(--scoutx-warning)] animate-pulse" },
  offline: { label: "Offline", dotClass: "bg-[var(--scoutx-destructive)]" },
};

export function ConnectionBadge({ status, className }: ConnectionBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
          "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)]",
          className,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} aria-hidden="true" />
        {config.label}
      </motion.span>
    </AnimatePresence>
  );
}
