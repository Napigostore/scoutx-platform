"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { formatCurrency as formatRewardCurrency } from "@scoutx/application";
import { TopScoutersSection, type TopScout } from "@/components/landing/top-scouters-section";

export default function ScoutsLeaderboardPage() {
  const [scouts, setScouts] = useState<TopScout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard/scouts?limit=50");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setScouts(json.data);
        }
      } catch (err) {
        console.error("Failed to load full scouts leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const formatCurrency = (cents: number) => {
    return formatRewardCurrency(cents, "USD");
  };

  return (
    <div className="min-h-screen bg-[var(--scoutx-background)] py-12">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--scoutx-primary)]">
              Network Intelligence Rankings
            </span>
            <h1 className="font-display mt-1 text-3xl font-black tracking-tight text-[var(--scoutx-foreground)] sm:text-4xl">
              SCOUT LEADERBOARD
            </h1>
            <p className="mt-1 text-sm text-[var(--scoutx-muted-foreground)]">
              Full national ranking of field operators ranked by trust, completed missions, and
              verification accuracy.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        {/* Podium Component */}
        <TopScoutersSection />

        {/* Full Detailed Leaderboard Table */}
        <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-xl">
          <h2 className="font-display mb-6 text-xl font-bold text-[var(--scoutx-foreground)]">
            Complete Operator Leaderboard Directory
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-[var(--scoutx-muted)]/40 h-16 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--scoutx-muted)]/50 border-b border-[var(--scoutx-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                    <th className="px-4 py-3 text-center">Rank</th>
                    <th className="px-4 py-3">Scout Name</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-center">Reputation</th>
                    <th className="px-4 py-3 text-center">Missions</th>
                    <th className="px-4 py-3 text-center">Pass Rate</th>
                    <th className="px-4 py-3 text-right">Total Rewards</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--scoutx-border)]">
                  {scouts.map((scout) => (
                    <tr
                      key={scout.scoutId}
                      className="hover:bg-[var(--scoutx-muted)]/30 transition-colors"
                    >
                      <td className="font-display px-4 py-4 text-center font-extrabold text-[var(--scoutx-foreground)]">
                        {scout.rank === 1
                          ? "👑 #1"
                          : scout.rank === 2
                            ? "🥈 #2"
                            : scout.rank === 3
                              ? "🥉 #3"
                              : `#${scout.rank}`}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-[var(--scoutx-primary)]/10 flex h-9 w-9 items-center justify-center rounded-full font-bold text-[var(--scoutx-primary)]">
                            {scout.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/scouts/${scout.scoutId}`}
                              className="font-bold text-[var(--scoutx-foreground)] hover:underline"
                            >
                              {scout.name}
                            </Link>
                            <div className="text-[10px] text-[var(--scoutx-muted-foreground)]">
                              {scout.badges[0] || "Verified Operator"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[var(--scoutx-muted-foreground)]">
                        {scout.location}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-amber-500">
                        ★ {scout.reputation}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-[var(--scoutx-foreground)]">
                        {scout.completedMissions}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-emerald-500">
                        {scout.successRate}%
                      </td>
                      <td className="font-display px-4 py-4 text-right font-black text-[var(--scoutx-primary)]">
                        {formatCurrency(scout.totalEarnedCents)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-semibold"
                          asChild
                        >
                          <Link href={`/scouts/${scout.scoutId}`}>View Profile</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
