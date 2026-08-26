"use client";

import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface EvidenceItem {
  id: string;
  caption: string;
  /** Placeholder — no image src needed for UI-only */
  type: "photo" | "video" | "note";
  capturedAt: string;
  capturedBy: string;
  verified: boolean;
  /** Optional geo location label */
  location?: string;
}

interface EvidenceWorkspaceProps {
  items: EvidenceItem[];
  className?: string;
}

const TYPE_ICONS = {
  photo: "📷",
  video: "🎥",
  note: "📝",
} as const;

/**
 * EvidenceWorkspace displays collected mission evidence in a
 * compact grid with verified badges, captions, and metadata.
 * Acts as the visual hub for field intelligence.
 */
export function EvidenceWorkspace({ items, className }: EvidenceWorkspaceProps) {
  if (items.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Evidence
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
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No evidence collected
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Scout uploads will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Evidence
        </h3>
        <Badge variant="outline" className="text-[8px] uppercase tracking-wider">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "hover:bg-[var(--scoutx-muted)]/20 group relative overflow-hidden rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] transition-colors",
            )}
          >
            {/* Media placeholder */}
            <div className="bg-[var(--scoutx-muted)]/20 flex aspect-[4/3] items-center justify-center">
              <span className="text-2xl opacity-40" aria-hidden="true">
                {TYPE_ICONS[item.type]}
              </span>
            </div>

            {/* Verified badge overlay */}
            {item.verified && (
              <div className="absolute right-1.5 top-1.5">
                <Badge
                  variant="success"
                  className="px-1.5 py-0.5 text-[7px] uppercase leading-none tracking-wider"
                >
                  ✓ Verified
                </Badge>
              </div>
            )}

            {/* Info */}
            <div className="space-y-0.5 p-2">
              <p className="truncate text-xs font-medium text-[var(--scoutx-foreground)]">
                {item.caption}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-[var(--scoutx-muted-foreground)]">
                <span className="font-medium">{item.capturedBy}</span>
                {item.location && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{item.location}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <time dateTime={item.capturedAt}>{item.capturedAt}</time>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
