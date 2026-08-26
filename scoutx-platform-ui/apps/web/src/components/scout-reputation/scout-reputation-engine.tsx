"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, Badge, cn } from "@scoutx/ui";
import { useRealtimeEvent } from "../../providers/realtime-event-provider";

/* ─── Rank System ─── */

export type ScoutRank = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Legend";

export function calculateScoutRank(trustScore: number): ScoutRank {
  if (trustScore >= 95) return "Legend";
  if (trustScore >= 85) return "Diamond";
  if (trustScore >= 75) return "Platinum";
  if (trustScore >= 60) return "Gold";
  if (trustScore >= 40) return "Silver";
  return "Bronze";
}

const RANK_BADGE_COLORS: Record<ScoutRank, string> = {
  Bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
  Silver: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Gold: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Platinum: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Diamond: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  Legend: "bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse",
};

/* ─── Types ─── */

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  unlocked: boolean;
}

export interface AchievementTimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

export interface ScoutReputationData {
  scoutId: string;
  scoutName: string;
  trustScore: number; // 0-100
  verificationRate: number; // percentage e.g. 94.5
  casesCompleted: number;
  casesRejected: number;
  avgResponseTimeMinutes: number;
  avgCompletionTimeHours: number;
  verificationScore: number; // 0-100
  activityScore: number; // 0-100
  completionScore: number; // 0-100
  communityScore: number; // 0-100
  badges: AchievementBadge[];
  recentAchievements: AchievementTimelineItem[];
}

interface ScoutReputationEngineProps {
  initialData: ScoutReputationData;
  className?: string;
}

/* ─── Component ─── */

export function ScoutReputationEngine({ initialData, className }: ScoutReputationEngineProps) {
  const [data, setData] = useState<ScoutReputationData>(initialData);

  const currentRank = calculateScoutRank(data.trustScore);

  // Realtime reputation updates
  useRealtimeEvent("*", (event) => {
    switch (event.type) {
      case "trust.updated":
        if (event.investigationId) {
          setData((prev) => {
            const newTrust = Math.min(100, Math.max(0, event.trustScore));
            const newRank = calculateScoutRank(newTrust);
            const rankUp = newRank !== calculateScoutRank(prev.trustScore);

            const newTimeline = [...prev.recentAchievements];
            if (rankUp) {
              newTimeline.unshift({
                id: `rank_${Date.now()}`,
                title: `Promoted to ${newRank}!`,
                description: `Trust score increased to ${newTrust}%`,
                timestamp: new Date().toISOString(),
                icon: "🏆",
              });
            }

            return {
              ...prev,
              trustScore: newTrust,
              verificationScore: Math.min(100, Math.round(newTrust * 0.95)),
              recentAchievements: newTimeline,
            };
          });
        }
        break;

      case "evidence.verified":
        setData((prev) => {
          const newVerifiedCount = prev.verificationRate > 0 ? prev.verificationRate + 0.5 : 100;
          return {
            ...prev,
            verificationRate: Math.min(100, Number(newVerifiedCount.toFixed(1))),
            verificationScore: Math.min(100, prev.verificationScore + 1),
          };
        });
        break;

      case "mission.updated":
        setData((prev) => ({
          ...prev,
          casesCompleted: prev.casesCompleted + 1,
          activityScore: Math.min(100, prev.activityScore + 2),
        }));
        break;
    }
  });

  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6", className)}>
      {/* ─── Header & Rank Summary ─── */}
      <Card className="bg-card text-card-foreground overflow-hidden border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{data.scoutName}</h2>
                <Badge
                  variant="outline"
                  className={cn("px-3 py-1 font-semibold", RANK_BADGE_COLORS[currentRank])}
                >
                  Rank: {currentRank}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Scout ID: {data.scoutId} • Live Reputation Metrics
              </p>
            </div>

            {/* Overall Reputation Display */}
            <div className="bg-muted/30 flex items-center gap-4 rounded-xl border px-5 py-3">
              <div className="text-right">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Overall Reputation
                </p>
                <p className="text-primary text-3xl font-extrabold">{data.trustScore}%</p>
              </div>
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                ⚡
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-3 lg:grid-cols-6">
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Verification Rate</p>
              <p className="text-foreground mt-0.5 text-lg font-bold">{data.verificationRate}%</p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Cases Completed</p>
              <p className="text-foreground mt-0.5 text-lg font-bold">{data.casesCompleted}</p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Cases Rejected</p>
              <p className="text-destructive mt-0.5 text-lg font-bold">{data.casesRejected}</p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Avg Response</p>
              <p className="text-foreground mt-0.5 text-lg font-bold">
                {data.avgResponseTimeMinutes}m
              </p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Avg Completion</p>
              <p className="text-foreground mt-0.5 text-lg font-bold">
                {data.avgCompletionTimeHours}h
              </p>
            </div>
            <div className="bg-background rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Current Rank</p>
              <p className="text-primary mt-0.5 text-lg font-bold">{currentRank}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Reputation Breakdown & Achievement Badges ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reputation Breakdown Scorecard */}
        <Card className="bg-card text-card-foreground border shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Reputation Breakdown</h3>

            <div className="space-y-4">
              {[
                { label: "Trust Score", value: data.trustScore, color: "bg-emerald-500" },
                {
                  label: "Verification Score",
                  value: data.verificationScore,
                  color: "bg-blue-500",
                },
                { label: "Activity Score", value: data.activityScore, color: "bg-indigo-500" },
                { label: "Completion Score", value: data.completionScore, color: "bg-violet-500" },
                { label: "Community Score", value: data.communityScore, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold">{item.value}/100</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <motion.div
                      className={cn("h-full rounded-full", item.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card className="bg-card text-card-foreground border shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Achievement Badges</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-all",
                    badge.unlocked
                      ? "bg-card border-primary/20 shadow-xs"
                      : "bg-muted/30 border-dashed opacity-60",
                  )}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-foreground text-xs font-bold">{badge.name}</p>
                      {badge.unlocked && (
                        <span className="py-0.2 rounded bg-emerald-500/10 px-1.5 text-[10px] font-semibold text-emerald-600">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Achievements Timeline ─── */}
      <Card className="bg-card text-card-foreground border shadow-sm">
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Achievements Timeline</h3>

          {data.recentAchievements.length === 0 ? (
            <p className="text-muted-foreground text-xs">No recent achievements recorded.</p>
          ) : (
            <div className="before:bg-border relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-0.5">
              {data.recentAchievements.map((item) => (
                <div key={item.id} className="relative flex items-start gap-3">
                  <div className="bg-primary ring-background absolute -left-6 top-1 h-3 w-3 rounded-full ring-4" />
                  <div className="bg-background flex-1 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-foreground text-xs font-bold">
                        {item.icon} {item.title}
                      </p>
                      <time className="text-muted-foreground text-[10px]">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
