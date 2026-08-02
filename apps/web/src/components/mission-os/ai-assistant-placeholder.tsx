"use client";

import { cn } from "@scoutx/ui";

interface AiAssistantPlaceholderProps {
  className?: string;
}

/**
 * AiAssistantPlaceholder shows a preview of the AI co-pilot
 * for mission analysis. Displays sample insights, a glowing
 * AI indicator, and a disabled query input.
 */
export function AiAssistantPlaceholder({ className }: AiAssistantPlaceholderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-[var(--scoutx-radius-sm)] bg-gradient-to-br from-[var(--scoutx-primary)] to-[var(--scoutx-accent)]">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        </div>
        <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          AI Assistant
        </h3>
        <span className="bg-[var(--scoutx-primary)]/10 rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-[var(--scoutx-primary)]">
          Preview
        </span>
      </div>

      <div className="rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)]">
        {/* Insights */}
        <div className="space-y-2 p-3">
          {/* Insight 1 */}
          <div className="border-[var(--scoutx-border)]/50 bg-[var(--scoutx-primary)]/5 rounded-[var(--scoutx-radius-sm)] border p-2">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3 w-3 text-[var(--scoutx-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              <span className="text-[9px] font-semibold text-[var(--scoutx-primary)]">
                Pattern Suggestion
              </span>
            </div>
            <p className="text-[var(--scoutx-foreground)]/70 mt-0.5 text-[10px]">
              Structural cracks in east wall correlate with flood damage patterns from 3 similar
              missions in this region.
            </p>
          </div>

          {/* Insight 2 */}
          <div className="border-[var(--scoutx-border)]/50 bg-[var(--scoutx-warning)]/5 rounded-[var(--scoutx-radius-sm)] border p-2">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3 w-3 text-[var(--scoutx-warning)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span className="text-[9px] font-semibold text-[var(--scoutx-warning)]">
                Risk Alert
              </span>
            </div>
            <p className="text-[var(--scoutx-foreground)]/70 mt-0.5 text-[10px]">
              Water level rising faster than predicted. Recommend expedited assessment.
            </p>
          </div>

          {/* Insight 3 */}
          <div className="border-[var(--scoutx-border)]/50 bg-[var(--scoutx-success)]/5 rounded-[var(--scoutx-radius-sm)] border p-2">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3 w-3 text-[var(--scoutx-success)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[9px] font-semibold text-[var(--scoutx-success)]">
                Coverage Note
              </span>
            </div>
            <p className="text-[var(--scoutx-foreground)]/70 mt-0.5 text-[10px]">
              Southeast quadrant has no scout coverage. Consider redirecting @scout_musa.
            </p>
          </div>
        </div>

        {/* Query input */}
        <div className="border-t border-[var(--scoutx-border)] p-2">
          <div className="bg-[var(--scoutx-muted)]/20 flex items-center gap-2 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] px-2.5 py-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
            <span className="flex-1 opacity-50">Ask the AI...</span>
            <div className="flex h-4 w-4 items-center justify-center">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-primary)] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--scoutx-primary)]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
