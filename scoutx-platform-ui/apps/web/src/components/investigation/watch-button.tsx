"use client";

import { useState, useCallback } from "react";
import { cn } from "@scoutx/ui";

interface WatchButtonProps {
  /** Initial watch state */
  initialWatched?: boolean;
  /** Callback when watch state changes */
  onToggle?: (watched: boolean) => void;
  /** Additional class names */
  className?: string;
}

/**
 * WatchButton toggles tracking/casing an investigation.
 * Uses an eye icon with fill animation to indicate tracked state.
 * Language: "Track Case" / "Tracking" (replaces "Watch").
 * Accessible: button with aria-label, aria-pressed.
 */
export function WatchButton({ initialWatched = false, onToggle, className }: WatchButtonProps) {
  const [tracked, setTracked] = useState(initialWatched);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback(() => {
    const next = !tracked;
    setTracked(next);
    setAnimating(true);
    onToggle?.(next);

    setTimeout(() => {
      setAnimating(false);
    }, 300);
  }, [tracked, onToggle]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--scoutx-radius-md)] px-3 py-1.5",
        "text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out",
        tracked
          ? "bg-[var(--scoutx-primary)]/10 text-[var(--scoutx-primary)]"
          : "bg-transparent text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-muted)] hover:text-[var(--scoutx-foreground)]",
        animating && "scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)] focus-visible:ring-offset-2",
        className,
      )}
      aria-pressed={tracked}
      aria-label={tracked ? "Stop tracking this case" : "Track this case"}
    >
      <svg
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          animating && "animate-[heartbeat_300ms_ease-out]",
        )}
        viewBox="0 0 24 24"
        fill={tracked ? "currentColor" : "none"}
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
      {tracked ? "Tracking" : "Track Case"}
    </button>
  );
}
