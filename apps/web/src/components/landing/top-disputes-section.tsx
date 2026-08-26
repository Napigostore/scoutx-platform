"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TopDisputeItem {
  id: string;
  missionId: string;
  title: string;
  category: string;
  missionStatus: string;
  disputeStatus: string;
  fundedCoin: number;
  voteCount: number;
  minVotesRequired: number;
  roundNumber: number;
  roundStatus: string;
  rewardFormatted: string;
  timeRemainingMs: number;
  ctaText: string;
}

export function TopDisputesSection() {
  const [disputes, setDisputes] = useState<TopDisputeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopDisputes() {
      try {
        const res = await fetch("/api/disputes/top");
        const data = await res.json();
        if (data.success && Array.isArray(data.disputes)) {
          setDisputes(data.disputes);
        }
      } catch (err) {
        console.error("Failed to load top disputes:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTopDisputes();
  }, []);

  if (!isLoading && disputes.length === 0) {
    return null; // Omit empty section if no active disputes exist
  }

  return (
    <section className="py-12 border-t border-[var(--scoutx-border)] bg-[var(--scoutx-muted)]/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                ⚖️ Community Governance
              </span>
              <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
                Vote & Earn +1 Coin
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--scoutx-foreground)] mt-2">
              TOP 10 COMMUNITY DISPUTES
            </h2>
            <p className="text-xs sm:text-sm text-[var(--scoutx-muted-foreground)] mt-1">
              Participate in active dispute trials, vote on evidence, and earn instant coin rewards.
            </p>
          </div>

          <Link
            href="/market?tab=disputes"
            className="mt-4 md:mt-0 text-xs font-bold text-[var(--scoutx-primary)] hover:underline flex items-center gap-1"
          >
            Explore All Disputes →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-xs transition-all hover:border-[var(--scoutx-primary)]/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[var(--scoutx-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                      {d.category.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                      Round #{d.roundNumber}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-[var(--scoutx-foreground)] mt-3 line-clamp-2 group-hover:text-[var(--scoutx-primary)] transition-colors">
                    {d.title}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--scoutx-muted)]/50 p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--scoutx-muted-foreground)] block">
                        Reward Pool:
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {d.rewardFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--scoutx-muted-foreground)] block">
                        Community Votes:
                      </span>
                      <span className="font-extrabold text-[var(--scoutx-foreground)]">
                        {d.voteCount} / {d.minVotesRequired}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--scoutx-border)] pt-3">
                  <div className="text-[11px] text-[var(--scoutx-muted-foreground)] font-medium">
                    ⚡ {d.fundedCoin.toLocaleString()} Staked Coin
                  </div>
                  <Link
                    href={`/missions/${d.missionId}?tab=dispute`}
                    className="rounded-lg bg-[var(--scoutx-primary)] px-3 py-1.5 text-xs font-bold text-[var(--scoutx-primary-foreground)] shadow-xs hover:opacity-90 transition-opacity"
                  >
                    {d.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
