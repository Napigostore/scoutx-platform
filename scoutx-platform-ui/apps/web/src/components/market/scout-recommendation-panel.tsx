"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, Badge, cn } from "@scoutx/ui";
import { calculateScoutMatchScore, type ScoutMatchInput } from "./matching-engine";

export interface ScoutRecommendationPanelProps {
  missionCategory: string;
  className?: string;
  onInviteScout?: (scoutId: string) => void;
}

const MOCK_SCOUTS: ScoutMatchInput[] = [
  {
    scoutId: "scout_1",
    name: "Alex Rivera",
    trustScore: 96,
    distanceKm: 3.2,
    categoryExpertise: ["OSINT", "Field Verification", "Asset Tracing"],
    verificationHistoryCount: 48,
    avgResponseTimeMins: 12,
    completionRate: 98,
    currentWorkloadCount: 1,
    lastActiveHoursAgo: 0.2,
  },
  {
    scoutId: "scout_2",
    name: "Elena Rostova",
    trustScore: 89,
    distanceKm: 8.5,
    categoryExpertise: ["Geolocation", "Field Verification"],
    verificationHistoryCount: 32,
    avgResponseTimeMins: 25,
    completionRate: 95,
    currentWorkloadCount: 0,
    lastActiveHoursAgo: 1.1,
  },
  {
    scoutId: "scout_3",
    name: "Marcus Vance",
    trustScore: 92,
    distanceKm: 1.4,
    categoryExpertise: ["Security Audit", "OSINT"],
    verificationHistoryCount: 65,
    avgResponseTimeMins: 8,
    completionRate: 99,
    currentWorkloadCount: 2,
    lastActiveHoursAgo: 0.1,
  },
  {
    scoutId: "scout_4",
    name: "Sarah Chen",
    trustScore: 84,
    distanceKm: 14.2,
    categoryExpertise: ["Physical Inspection", "Document Audit"],
    verificationHistoryCount: 21,
    avgResponseTimeMins: 45,
    completionRate: 91,
    currentWorkloadCount: 0,
    lastActiveHoursAgo: 3.5,
  },
];

type ScoutFilterTab = "Recommended" | "Nearby" | "Elite" | "Recently Active";

export function ScoutRecommendationPanel({
  missionCategory,
  className,
  onInviteScout,
}: ScoutRecommendationPanelProps) {
  const [tab, setTab] = useState<ScoutFilterTab>("Recommended");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const processedScouts = useMemo(() => {
    return MOCK_SCOUTS.map((scout) =>
      calculateScoutMatchScore(scout, { category: missionCategory }),
    );
  }, [missionCategory]);

  const filteredScouts = useMemo(() => {
    const list = [...processedScouts];
    switch (tab) {
      case "Recommended":
        return list.sort((a, b) => b.matchScore - a.matchScore);
      case "Nearby":
        return list.sort((a, b) => a.distanceKm - b.distanceKm);
      case "Elite":
        return list.filter((s) => s.trustScore >= 90).sort((a, b) => b.trustScore - a.trustScore);
      case "Recently Active":
        return list.sort((a, b) => a.lastActiveHoursAgo - b.lastActiveHoursAgo);
      default:
        return list;
    }
  }, [processedScouts, tab]);

  const handleInvite = (scoutId: string) => {
    setInvitedIds((prev) => new Set(prev).add(scoutId));
    onInviteScout?.(scoutId);
  };

  return (
    <Card className={cn("bg-card text-card-foreground shadow-xs border", className)}>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Scout Recommendations</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              AI-matched field scouts for {missionCategory}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-muted/40 flex flex-wrap gap-1 rounded-lg border p-1">
            {(["Recommended", "Nearby", "Elite", "Recently Active"] as ScoutFilterTab[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    tab === t
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Scout Cards List */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredScouts.map((scout) => {
            const isInvited = invitedIds.has(scout.scoutId);
            return (
              <div
                key={scout.scoutId}
                className="bg-background hover:border-primary/30 flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-foreground text-sm font-bold">{scout.name}</h4>
                      <p className="text-muted-foreground text-[11px]">
                        {scout.distanceKm} km away • {scout.avgResponseTimeMins}m avg response
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-0.5 text-xs font-extrabold",
                        scout.matchScore >= 90
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                          : "bg-primary/10 text-primary border-primary/20",
                      )}
                    >
                      {scout.matchScore}% Match
                    </Badge>
                  </div>

                  {/* Match Explanations */}
                  <div className="mt-2.5 space-y-1">
                    {scout.explanation.map((reason, idx) => (
                      <div
                        key={idx}
                        className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
                      >
                        <span className="font-bold text-emerald-500">✓</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Trust: </span>
                    <span className="text-foreground font-bold">{scout.trustScore}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInvite(scout.scoutId)}
                    disabled={isInvited}
                    className={cn(
                      "focus:ring-primary rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2",
                      isInvited
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {isInvited ? "Invited ✓" : "Invite Scout"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
