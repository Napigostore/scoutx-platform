"use client";

import { useCallback } from "react";
import { cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface EvidenceFilterOptions {
  /** Search query string */
  query: string;
  /** Filter by verification status */
  verified: "all" | "verified" | "unverified";
  /** Sort order */
  sort: "newest" | "oldest";
}

interface EvidenceFiltersProps {
  filters: EvidenceFilterOptions;
  onChange: (filters: EvidenceFilterOptions) => void;
  className?: string;
}

/* ─── Component ─── */

/**
 * EvidenceFilters provides controls for filtering and sorting
 * evidence items: text search, verified status toggle, and sort order.
 * Compact layout for mobile; inline row for desktop.
 */
export function EvidenceFilters({ filters, onChange, className }: EvidenceFiltersProps) {
  const update = useCallback(
    (patch: Partial<EvidenceFilterOptions>) => {
      onChange({ ...filters, ...patch });
    },
    [filters, onChange],
  );

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3", className)}>
      {/* Search */}
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--scoutx-muted-foreground)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Filter evidence…"
          aria-label="Filter evidence by keyword"
          className={cn(
            "h-8 w-full rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] pl-8 pr-2.5 text-xs",
            "text-[var(--scoutx-foreground)] placeholder:text-[var(--scoutx-muted-foreground)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)]",
          )}
        />
      </div>

      {/* Verified filter */}
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Verification status filter"
      >
        {(["all", "verified", "unverified"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={filters.verified === option}
            onClick={() => update({ verified: option })}
            className={cn(
              "rounded-[var(--scoutx-radius-sm)] px-2 py-1 text-[10px] font-medium transition-colors",
              filters.verified === option
                ? "bg-[var(--scoutx-primary)] text-[var(--scoutx-primary-foreground)]"
                : "text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-muted)] hover:text-[var(--scoutx-foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)]",
            )}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as "newest" | "oldest" })}
        aria-label="Sort order"
        className={cn(
          "h-8 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-2 text-xs",
          "text-[var(--scoutx-foreground)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)]",
        )}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  );
}
