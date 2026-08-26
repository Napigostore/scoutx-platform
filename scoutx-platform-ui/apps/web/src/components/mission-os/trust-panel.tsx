"use client";

import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface ScoutTrustInfo {
  scoutName: string;
  /** Reliability score 0–100 */
  reliability: number;
  /** Completed missions count */
  completedMissions: number;
  /** Badges earned */
  badges: string[];
  /** Last active timestamp */
  lastActive: string;
}

export interface VerifierInfo {
  verifierName: string;
  /** Number of verifications performed */
  verificationsDone: number;
  /** Acceptance rate 0–100 */
  acceptanceRate: number;
}

interface TrustPanelProps {
  scouts: ScoutTrustInfo[];
  verifiers: VerifierInfo[];
  className?: string;
}

/**
 * TrustPanel shows the trust/reputation data for assigned scouts
 * and verifiers on a mission — reliability scores, badges, activity.
 */
export function TrustPanel({ scouts, verifiers, className }: TrustPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-display text-sm font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
        Trust
      </h3>

      <div className="rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3">
        {/* Scouts section */}
        {scouts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--scoutx-muted-foreground)]">
              Scouts on Mission
            </p>
            {scouts.map((scout, idx) => (
              <motion.div
                key={scout.scoutName}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * idx }}
                className="border-[var(--scoutx-border)]/50 rounded-[var(--scoutx-radius-sm)] border p-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-[var(--scoutx-primary)]/15 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-[var(--scoutx-primary)]">
                      {scout.scoutName
                        .split("_")
                        .map((s) => s[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span className="text-xs font-medium text-[var(--scoutx-foreground)]">
                      {scout.scoutName}
                    </span>
                  </div>
                  {/* Reliability ring */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(var(--scoutx-primary) ${scout.reliability}%, var(--scoutx-muted) ${scout.reliability}%)`,
                      }}
                    >
                      <div className="h-[14px] w-[14px] rounded-full bg-[var(--scoutx-card)]" />
                    </div>
                    <span className="font-display text-[10px] font-bold tabular-nums text-[var(--scoutx-foreground)]">
                      {scout.reliability}%
                    </span>
                  </div>
                </div>

                {/* Details row */}
                <div className="mt-1.5 flex items-center gap-2 text-[9px] text-[var(--scoutx-muted-foreground)]">
                  <span>{scout.completedMissions} missions</span>
                  <span aria-hidden="true">·</span>
                  <span>{scout.lastActive}</span>
                </div>

                {/* Badges */}
                {scout.badges.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {scout.badges.map((badge) => (
                      <Badge
                        key={badge}
                        variant="secondary"
                        className="py-0.5 text-[7px] uppercase leading-none tracking-wider"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Divider */}
        {scouts.length > 0 && verifiers.length > 0 && (
          <div className="border-[var(--scoutx-border)]/50 my-2 border-t" />
        )}

        {/* Verifiers section */}
        {verifiers.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--scoutx-muted-foreground)]">
              Verifiers
            </p>
            {verifiers.map((verifier, idx) => (
              <motion.div
                key={verifier.verifierName}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * (idx + scouts.length) }}
                className="hover:bg-[var(--scoutx-muted)]/20 flex items-center justify-between rounded-[var(--scoutx-radius-sm)] px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-3.5 w-3.5 text-[var(--scoutx-primary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                  <span className="text-xs text-[var(--scoutx-foreground)]">
                    {verifier.verifierName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-[var(--scoutx-muted-foreground)]">
                  <span>{verifier.verificationsDone} verifications</span>
                  <span
                    className={cn(
                      "font-medium",
                      verifier.acceptanceRate >= 90
                        ? "text-[var(--scoutx-success)]"
                        : verifier.acceptanceRate >= 70
                          ? "text-[var(--scoutx-warning)]"
                          : "text-[var(--scoutx-destructive)]",
                    )}
                  >
                    {verifier.acceptanceRate}% acceptance
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {scouts.length === 0 && verifiers.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <svg
              className="h-5 w-5 text-[var(--scoutx-muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zm-13.5 0a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <p className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
              No trust data
            </p>
            <p className="text-[10px] text-[var(--scoutx-muted-foreground)]">
              Scout trust info will appear once assigned
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
