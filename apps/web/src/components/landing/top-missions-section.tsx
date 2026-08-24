"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@scoutx/ui";

export interface RankedMission {
  rank: number;
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  budgetCents: number;
  currency: string;
  budgetLabel: string;
  city: string;
  country: string;
  requiredTags: string[];
  expiresAt: string;
  createdAt: string;
  requester: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    reputation: number;
  };
  demandCount: number;
  trendingReason: string;
  compositeScore: number;
  difficulty: string;
  estimatedTimeMins: number;
  evidenceRequiredCount: number;
}

type FilterType = "trending" | "highest_reward" | "most_wanted" | "ending_soon";

export function TopMissionsSection() {
  const [filter, setFilter] = useState<FilterType>("trending");
  const [missions, setMissions] = useState<RankedMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopMissions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leaderboard/missions?filter=${filter}&limit=6`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMissions(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch top missions:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopMissions();
  }, [filter]);

  return (
    <section className="border-t border-[var(--scoutx-border)] bg-[var(--scoutx-background)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
            🔥 Field Operations Ranking
          </span>
          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-[var(--scoutx-foreground)] sm:text-4xl">
            TOP MISSIONS
          </h2>
          <p className="mt-2 text-base text-[var(--scoutx-muted-foreground)] sm:text-lg">
            The missions the network wants to complete.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[
            { id: "trending", label: "Trending" },
            { id: "highest_reward", label: "Highest Reward" },
            { id: "most_wanted", label: "Most Wanted" },
            { id: "ending_soon", label: "Ending Soon" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as FilterType)}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                filter === item.id
                  ? "scale-105 bg-[var(--scoutx-primary)] text-[var(--scoutx-primary-foreground)] shadow-md"
                  : "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] text-[var(--scoutx-muted-foreground)] hover:border-[var(--scoutx-primary)] hover:text-[var(--scoutx-foreground)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Missions Grid */}
        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[var(--scoutx-card)]/50 h-64 animate-pulse rounded-2xl border border-[var(--scoutx-border)] p-6"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-md transition-all hover:-translate-y-1 hover:border-[var(--scoutx-primary)] hover:shadow-xl"
              >
                {/* Top Header */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20 text-xs font-extrabold text-amber-500">
                      #{mission.rank}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--scoutx-primary)]">
                      {mission.trendingReason}
                    </span>
                  </div>

                  <h3 className="font-display mt-4 line-clamp-2 text-lg font-bold text-[var(--scoutx-foreground)] transition-colors group-hover:text-[var(--scoutx-primary)]">
                    <Link href={`/missions/${mission.id}`}>{mission.title}</Link>
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs text-[var(--scoutx-muted-foreground)]">
                    {mission.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--scoutx-muted-foreground)]">
                    <span>
                      📍 {mission.city}, {mission.country}
                    </span>
                    <span>•</span>
                    <span>⏱ {mission.estimatedTimeMins} mins</span>
                    <span>•</span>
                    <span>📷 {mission.evidenceRequiredCount} evidence files</span>
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="mt-6 border-t border-[var(--scoutx-border)] pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                        Bounty Reward
                      </span>
                      <p className="font-display text-xl font-black text-[var(--scoutx-primary)]">
                        {mission.budgetLabel}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                        Requester
                      </span>
                      <p className="text-xs font-bold text-amber-500">
                        ★ {mission.requester.reputation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 text-xs font-semibold"
                      asChild
                    >
                      <Link href={`/missions/${mission.id}`}>View Mission</Link>
                    </Button>
                    <Button size="sm" className="w-1/2 text-xs font-bold" asChild>
                      <Link href={`/scout/missions/${mission.id}`}>Claim Mission</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Marketplace Button */}
        <div className="mt-12 flex justify-center">
          <Button size="lg" className="rounded-full px-8 text-sm font-bold shadow-lg" asChild>
            <Link href="/missions">Explore All Live Missions →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
