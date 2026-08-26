"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { formatCurrency as formatRewardCurrency } from "@scoutx/application";

export interface TopScout {
  rank: number;
  scoutId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  reputation: number;
  reliabilityScore: number;
  completedMissions: number;
  successRate: number;
  totalEarnedCents: number;
  location: string;
  badges: string[];
  streakDays: number;
}

export function TopScoutersSection() {
  const [scouts, setScouts] = useState<TopScout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchTopScouters() {
      try {
        const res = await fetch("/api/leaderboard/scouts?limit=50");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setScouts(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch top scouters:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopScouters();
  }, []);

  const top1 = scouts.find((s) => s.rank === 1) || scouts[0];
  const top2 = scouts.find((s) => s.rank === 2) || scouts[1];
  const top3 = scouts.find((s) => s.rank === 3) || scouts[2];
  const remaining = scouts.filter((s) => s.rank > 3);

  const formatCurrency = (cents: number) => {
    return formatRewardCurrency(cents, "USD");
  };

  return (
    <section className="relative overflow-hidden bg-[var(--scoutx-background)] py-16 sm:py-24">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--scoutx-primary)]">
            Network Field Operators
          </span>
          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-[var(--scoutx-foreground)] sm:text-4xl">
            TOP SCOUTERS
          </h2>
          <p className="mt-2 text-base text-[var(--scoutx-muted-foreground)] sm:text-lg">
            The field operators trusted most by the network.
          </p>
        </div>

        {/* TOP 3 PODIUM */}
        {isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[var(--scoutx-card)]/50 h-72 animate-pulse rounded-2xl border border-[var(--scoutx-border)] p-6"
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-end">
            {/* Rank 2 (Left) */}
            {top2 && (
              <div className="order-2 flex flex-col items-center rounded-2xl border border-slate-300/60 bg-[var(--scoutx-card)] p-6 shadow-lg transition-all hover:-translate-y-1 md:order-1 dark:border-slate-700/80">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 p-1 shadow-md dark:from-slate-700 dark:to-slate-900">
                  <div className="font-display flex h-full w-full items-center justify-center rounded-full bg-[var(--scoutx-card)] text-2xl font-bold text-[var(--scoutx-foreground)]">
                    {top2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--scoutx-card)] bg-slate-300 text-xs font-black text-slate-900 shadow-sm">
                    #2
                  </span>
                </div>

                <h3 className="font-display mt-4 text-center text-lg font-bold text-[var(--scoutx-foreground)]">
                  <Link href={`/scouts/${top2.scoutId}`} className="hover:underline">
                    {top2.name}
                  </Link>
                </h3>
                <p className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                  {top2.location}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    ★ {top2.reputation}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[var(--scoutx-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                    {top2.completedMissions} missions
                  </span>
                </div>

                <div className="mt-4 w-full border-t border-[var(--scoutx-border)] pt-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                    Total Rewards
                  </span>
                  <p className="font-display text-lg font-black text-[var(--scoutx-foreground)]">
                    {formatCurrency(top2.totalEarnedCents)}
                  </p>
                </div>
              </div>
            )}

            {/* Rank 1 (Center - Highlighted) */}
            {top1 && (
              <div className="order-1 flex flex-col items-center rounded-3xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-500/15 via-[var(--scoutx-card)] to-[var(--scoutx-card)] p-8 shadow-2xl transition-all hover:-translate-y-1 md:order-2 md:-translate-y-4">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-1.5 shadow-xl">
                  <div className="font-display flex h-full w-full items-center justify-center rounded-full bg-[var(--scoutx-card)] text-3xl font-black text-amber-500">
                    {top1.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -top-3.5 flex items-center gap-1 rounded-full border-2 border-[var(--scoutx-card)] bg-amber-500 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-md">
                    RANK #1
                  </span>
                </div>

                <span className="mt-4 rounded-full border border-amber-500/30 bg-amber-500/20 px-3.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                  Top Operator
                </span>

                <h3 className="font-display mt-2 text-center text-xl font-black text-[var(--scoutx-foreground)]">
                  <Link href={`/scouts/${top1.scoutId}`} className="hover:underline">
                    {top1.name}
                  </Link>
                </h3>
                <p className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                  {top1.location}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    ★ {top1.reputation} reputation
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-[var(--scoutx-primary)]">
                    {top1.completedMissions} missions
                  </span>
                </div>

                <div className="mt-6 w-full border-t border-amber-500/30 pt-4 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                    Total Rewards Earned
                  </span>
                  <p className="font-display text-2xl font-black text-[var(--scoutx-primary)]">
                    {formatCurrency(top1.totalEarnedCents)}
                  </p>
                </div>
              </div>
            )}

            {/* Rank 3 (Right) */}
            {top3 && (
              <div className="order-3 flex flex-col items-center rounded-2xl border border-amber-700/30 bg-[var(--scoutx-card)] p-6 shadow-lg transition-transform hover:-translate-y-1 md:order-3">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-amber-900 p-1 shadow-md">
                  <div className="font-display flex h-full w-full items-center justify-center rounded-full bg-[var(--scoutx-card)] text-2xl font-bold text-[var(--scoutx-foreground)]">
                    {top3.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-amber-800 text-xs font-extrabold text-amber-100 shadow-sm dark:border-amber-900">
                    #3
                  </span>
                </div>

                <h3 className="font-display mt-4 text-center text-lg font-bold text-[var(--scoutx-foreground)]">
                  <Link href={`/scouts/${top3.scoutId}`} className="hover:underline">
                    {top3.name}
                  </Link>
                </h3>
                <p className="text-xs text-[var(--scoutx-muted-foreground)]">{top3.location}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    ★ {top3.reputation}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[var(--scoutx-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                    {top3.completedMissions} missions
                  </span>
                </div>

                <div className="mt-4 w-full border-t border-[var(--scoutx-border)] pt-3 text-center">
                  <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                    Earned
                  </span>
                  <p className="font-display text-lg font-extrabold text-[var(--scoutx-foreground)]">
                    {formatCurrency(top3.totalEarnedCents)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPACT / EXPANDABLE LEADERBOARD (Ranks 4..50) */}
        {remaining.length > 0 && (
          <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] shadow-md">
            <div className="bg-[var(--scoutx-muted)]/40 flex items-center justify-between border-b border-[var(--scoutx-border)] px-6 py-4">
              <h4 className="font-display text-base font-bold text-[var(--scoutx-foreground)]">
                Field Operator Rankings (#4 – #{scouts.length})
              </h4>
              <span className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                {scouts.length} Verified Scouts Listed
              </span>
            </div>

            <div className="divide-y divide-[var(--scoutx-border)]">
              {(isExpanded ? remaining : remaining.slice(0, 7)).map((scout) => (
                <div
                  key={scout.scoutId}
                  className="hover:bg-[var(--scoutx-muted)]/30 flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--scoutx-muted)] text-xs font-bold text-[var(--scoutx-muted-foreground)]">
                      {scout.rank < 10 ? `0${scout.rank}` : scout.rank}
                    </span>

                    <div className="bg-[var(--scoutx-primary)]/10 font-display border-[var(--scoutx-primary)]/30 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold text-[var(--scoutx-primary)]">
                      {scout.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/scouts/${scout.scoutId}`}
                          className="font-display text-sm font-bold text-[var(--scoutx-foreground)] hover:underline"
                        >
                          {scout.name}
                        </Link>
                        {scout.badges.length > 0 && (
                          <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--scoutx-primary)]">
                            {scout.badges[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--scoutx-muted-foreground)]">
                        {scout.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                        Reputation
                      </span>
                      <p className="text-xs font-bold text-amber-500">★ {scout.reputation}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                        Missions
                      </span>
                      <p className="text-xs font-semibold text-[var(--scoutx-foreground)]">
                        {scout.completedMissions} ({scout.successRate}% pass)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                        Total Earned
                      </span>
                      <p className="font-display text-sm font-extrabold text-[var(--scoutx-primary)]">
                        {formatCurrency(scout.totalEarnedCents)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {remaining.length > 7 && (
              <div className="bg-[var(--scoutx-muted)]/20 border-t border-[var(--scoutx-border)] p-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hover:bg-[var(--scoutx-primary)]/10 font-bold text-[var(--scoutx-primary)]"
                >
                  {isExpanded
                    ? "▲ Thu gọn danh sách Top 10"
                    : `▼ Xem toàn bộ ${scouts.length} Top Scouts (Hạng #4 đến #${scouts.length})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 text-sm font-semibold"
            asChild
          >
            <Link href="/scouts">View Full Leaderboard (50 Scouts) →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
