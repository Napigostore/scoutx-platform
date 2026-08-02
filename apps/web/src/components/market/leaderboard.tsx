"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, cn } from "@scoutx/ui";

export interface LeaderboardEntry {
  rank: number;
  scoutId: string;
  name: string;
  avatarUrl?: string;
  trustScore: number;
  casesCompleted: number;
  verificationQualityPercent: number; // e.g. 98.2%
  coinsEarned: number;
  avgResponseMins: number;
  country: string;
  city: string;
  category: string;
}

type RegionFilter = "Global" | "Country" | "City";
type CategoryFilter = "All" | "OSINT" | "Field Verification" | "Security Audit";
type TimeframeFilter = "Weekly" | "Monthly" | "All Time";

const INITIAL_LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    scoutId: "scout_3",
    name: "Marcus Vance",
    trustScore: 99,
    casesCompleted: 142,
    verificationQualityPercent: 99.4,
    coinsEarned: 18450,
    avgResponseMins: 8,
    country: "USA",
    city: "San Francisco",
    category: "OSINT",
  },
  {
    rank: 2,
    scoutId: "scout_1",
    name: "Alex Rivera",
    trustScore: 96,
    casesCompleted: 118,
    verificationQualityPercent: 98.1,
    coinsEarned: 14200,
    avgResponseMins: 12,
    country: "USA",
    city: "San Francisco",
    category: "Field Verification",
  },
  {
    rank: 3,
    scoutId: "scout_2",
    name: "Elena Rostova",
    trustScore: 94,
    casesCompleted: 95,
    verificationQualityPercent: 96.8,
    coinsEarned: 11900,
    avgResponseMins: 18,
    country: "Germany",
    city: "Berlin",
    category: "Security Audit",
  },
  {
    rank: 4,
    scoutId: "scout_4",
    name: "Sarah Chen",
    trustScore: 91,
    casesCompleted: 78,
    verificationQualityPercent: 94.5,
    coinsEarned: 9400,
    avgResponseMins: 24,
    country: "Singapore",
    city: "Singapore",
    category: "OSINT",
  },
  {
    rank: 5,
    scoutId: "scout_5",
    name: "David Kim",
    trustScore: 88,
    casesCompleted: 64,
    verificationQualityPercent: 92.0,
    coinsEarned: 7600,
    avgResponseMins: 32,
    country: "South Korea",
    city: "Seoul",
    category: "Field Verification",
  },
];

export function Leaderboard({ className }: { className?: string }) {
  const [region, setRegion] = useState<RegionFilter>("Global");
  const [category] = useState<CategoryFilter>("All");
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("All Time");

  const filteredEntries = useMemo(() => {
    return INITIAL_LEADERBOARD_DATA.filter((entry) => {
      if (category !== "All" && entry.category !== category) return false;
      return true;
    }).sort((a, b) => b.trustScore - a.trustScore);
  }, [category]);

  return (
    <Card className={cn("bg-card text-card-foreground shadow-xs border", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Scout Leaderboard</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Top performing scouts ranked by trust, cases completed, and verification quality
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe */}
            <div className="bg-muted/40 flex items-center gap-1 rounded-lg border p-1 text-xs">
              {(["Weekly", "Monthly", "All Time"] as TimeframeFilter[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "rounded-md px-2 py-1 font-medium transition-colors",
                    timeframe === tf
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Region */}
            <div className="bg-muted/40 flex items-center gap-1 rounded-lg border p-1 text-xs">
              {(["Global", "Country", "City"] as RegionFilter[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={cn(
                    "rounded-md px-2 py-1 font-medium transition-colors",
                    region === r
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / List */}
        <div className="divide-y overflow-hidden rounded-xl border">
          <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 gap-2 p-3 text-[11px] font-bold uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4 sm:col-span-3">Scout</div>
            <div className="col-span-2 text-center">Trust</div>
            <div className="col-span-2 hidden text-center sm:block">Cases</div>
            <div className="col-span-2 hidden text-center md:block">Quality</div>
            <div className="col-span-3 text-right sm:col-span-2">Coins Earned</div>
          </div>

          {filteredEntries.map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.scoutId}
                className="hover:bg-muted/30 grid grid-cols-12 items-center gap-2 p-3 text-xs transition-colors"
              >
                <div className="col-span-1 flex justify-center">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      rank === 1 && "bg-amber-500 font-extrabold text-amber-950",
                      rank === 2 && "bg-slate-300 font-extrabold text-slate-900",
                      rank === 3 && "bg-amber-700 font-extrabold text-amber-50",
                      rank > 3 && "text-muted-foreground",
                    )}
                  >
                    {rank}
                  </span>
                </div>

                <div className="col-span-4 sm:col-span-3">
                  <p className="text-foreground font-bold">{entry.name}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {entry.city}, {entry.country}
                  </p>
                </div>

                <div className="text-primary col-span-2 text-center font-bold">
                  {entry.trustScore}%
                </div>

                <div className="text-foreground col-span-2 hidden text-center font-medium sm:block">
                  {entry.casesCompleted}
                </div>

                <div className="col-span-2 hidden text-center font-medium text-emerald-500 md:block">
                  {entry.verificationQualityPercent}%
                </div>

                <div className="col-span-3 text-right font-extrabold text-amber-500 sm:col-span-2">
                  {entry.coinsEarned.toLocaleString()} 🪙
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
