"use client";

import { cn } from "@scoutx/ui";

interface LiveChatPlaceholderProps {
  className?: string;
}

/**
 * LiveChatPlaceholder is a visual placeholder for the real-time
 * mission chat / collaboration feature. Displays a preview of
 * the chat interface with sample messages and a disabled input.
 */
export function LiveChatPlaceholder({ className }: LiveChatPlaceholderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Live Chat
      </h3>

      <div className="flex flex-col rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)]">
        {/* Messages */}
        <div className="flex-1 space-y-2 p-3">
          {/* Sample message 1 */}
          <div className="flex items-start gap-2">
            <div className="bg-[var(--scoutx-primary)]/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-[var(--scoutx-primary)]">
              AK
            </div>
            <div className="bg-[var(--scoutx-muted)]/30 min-w-0 flex-1 rounded-[var(--scoutx-radius-md)] px-2.5 py-1.5">
              <p className="flex items-baseline gap-1.5">
                <span className="text-[9px] font-semibold text-[var(--scoutx-foreground)]">
                  @scout_kato
                </span>
                <span className="text-[8px] text-[var(--scoutx-muted-foreground)]">14:23</span>
              </p>
              <p className="text-[var(--scoutx-foreground)]/80 text-[10px]">
                North entrance is clear. Moving to east wall.
              </p>
            </div>
          </div>

          {/* Sample message 2 */}
          <div className="flex items-start justify-end gap-2">
            <div className="bg-[var(--scoutx-primary)]/10 min-w-0 max-w-[85%] rounded-[var(--scoutx-radius-md)] px-2.5 py-1.5">
              <p className="flex items-baseline justify-end gap-1.5">
                <span className="text-[8px] text-[var(--scoutx-muted-foreground)]">14:25</span>
                <span className="text-[9px] font-semibold text-[var(--scoutx-primary)]">
                  @requester
                </span>
              </p>
              <p className="text-[var(--scoutx-foreground)]/80 text-[10px]">
                Copy that. Focus on structural damage.
              </p>
            </div>
            <div className="bg-[var(--scoutx-warning)]/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-[var(--scoutx-warning)]">
              AC
            </div>
          </div>

          {/* Sample message 3 */}
          <div className="flex items-start gap-2">
            <div className="bg-[var(--scoutx-success)]/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-[var(--scoutx-success)]">
              AM
            </div>
            <div className="bg-[var(--scoutx-muted)]/30 min-w-0 flex-1 rounded-[var(--scoutx-radius-md)] px-2.5 py-1.5">
              <p className="flex items-baseline gap-1.5">
                <span className="text-[9px] font-semibold text-[var(--scoutx-foreground)]">
                  @scout_amina
                </span>
                <span className="text-[8px] text-[var(--scoutx-muted-foreground)]">14:27</span>
              </p>
              <p className="text-[var(--scoutx-foreground)]/80 text-[10px]">
                East wall has visible crack. Uploading photos now.
              </p>
            </div>
          </div>

          {/* System message */}
          <div className="flex justify-center">
            <span className="bg-[var(--scoutx-muted)]/30 rounded-full px-2 py-0.5 text-[8px] text-[var(--scoutx-muted-foreground)]">
              @scout_musa joined the mission
            </span>
          </div>
        </div>

        {/* Disabled input */}
        <div className="border-t border-[var(--scoutx-border)] p-2">
          <div className="bg-[var(--scoutx-muted)]/20 flex items-center gap-2 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] px-2.5 py-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
            <svg
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            <span className="flex-1 opacity-50">Chat coming soon...</span>
            <svg
              className="h-3.5 w-3.5 shrink-0 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
