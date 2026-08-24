"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@scoutx/ui";

export interface LiveMissionCard {
  id: string;
  title: string;
  category: string;
  urgency: string;
  budgetLabel: string;
  budgetCents: number;
  city: string;
  country: string;
  expiresAt: string;
  status: string;
  radiusMeters: number;
  requesterReputation: number;
  applicantsCount: number;
  difficulty: string;
  estimatedMins: number;
  evidenceRequiredCount: number;
}

export function LiveMarketplaceDiscovery() {
  const [missions, setMissions] = useState<LiveMissionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveMissions() {
      try {
        const res = await fetch("/api/leaderboard/missions?filter=trending&limit=6");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMissions(
            json.data.map((m: Record<string, unknown>) => ({
              id: m.id,
              title: m.title,
              category: m.category,
              urgency: m.urgency,
              budgetLabel: m.budgetLabel,
              budgetCents: m.budgetCents,
              city: m.city,
              country: m.country,
              expiresAt: m.expiresAt,
              status: m.status,
              radiusMeters: m.radiusMeters || 1500,
              requesterReputation: (m.requester as { reputation?: number })?.reputation || 4.9,
              applicantsCount: (m.demandCount as number) || 8,
              difficulty: (m.difficulty as string) || "Medium",
              estimatedMins: (m.estimatedTimeMins as number) || 30,
              evidenceRequiredCount: (m.evidenceRequiredCount as number) || 2,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load live discovery missions:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLiveMissions();
  }, []);

  return (
    <section className="border-b border-[var(--scoutx-border)] bg-[var(--scoutx-card)] py-12 shadow-inner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Container Box */}
        <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] p-6 shadow-xl sm:p-8">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 border-b border-[var(--scoutx-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--scoutx-primary)]">
                  Live Marketplace Discovery
                </span>
              </div>
              <h3 className="font-display mt-1 text-2xl font-black tracking-tight text-[var(--scoutx-foreground)] sm:text-3xl">
                LIVE MISSIONS
              </h3>
              <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
                Real-time active field missions requiring verification right now.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="shadow-xs rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2 text-center">
                <span className="text-xs font-bold text-[var(--scoutx-primary)]">1,248</span>
                <span className="ml-1 text-xs text-[var(--scoutx-muted-foreground)]">
                  active missions
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-5 text-xs font-bold"
                asChild
              >
                <Link href="/missions">View all →</Link>
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[var(--scoutx-card)]/60 h-56 animate-pulse rounded-2xl border border-[var(--scoutx-border)]"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {missions.map((card) => (
                <div
                  key={card.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-sm transition-all hover:border-[var(--scoutx-primary)] hover:shadow-lg"
                >
                  <div>
                    {/* Top Row: Category & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-md bg-[var(--scoutx-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--scoutx-muted-foreground)]">
                        {card.category.replace(/_/g, " ")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-[var(--scoutx-primary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {card.status}
                      </span>
                    </div>

                    {/* Mission Title */}
                    <h4 className="font-display mt-3 line-clamp-2 text-base font-bold text-[var(--scoutx-foreground)] transition-colors group-hover:text-[var(--scoutx-primary)]">
                      <Link href={`/missions/${card.id}`}>{card.title}</Link>
                    </h4>

                    {/* Metadata Specs */}
                    <div className="border-[var(--scoutx-border)]/60 mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-[11px] text-[var(--scoutx-muted-foreground)]">
                      <div>
                        📍 Location:{" "}
                        <strong className="text-[var(--scoutx-foreground)]">{card.city}</strong>
                      </div>
                      <div>
                        ⏱ Time:{" "}
                        <strong className="text-[var(--scoutx-foreground)]">
                          ~{card.estimatedMins}m
                        </strong>
                      </div>
                      <div>
                        🎯 Level:{" "}
                        <strong className="text-[var(--scoutx-foreground)]">
                          {card.difficulty}
                        </strong>
                      </div>
                      <div>
                        📷 Evidence:{" "}
                        <strong className="text-[var(--scoutx-foreground)]">
                          {card.evidenceRequiredCount} files
                        </strong>
                      </div>
                      <div>
                        👥 Interested:{" "}
                        <strong className="text-emerald-500">{card.applicantsCount} scouts</strong>
                      </div>
                      <div>
                        ★ Requester:{" "}
                        <strong className="text-amber-500">{card.requesterReputation}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Reward & CTAs */}
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--scoutx-border)] pt-3">
                    <div>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                        Reward
                      </span>
                      <p className="font-display text-lg font-black text-[var(--scoutx-primary)]">
                        {card.budgetLabel}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 text-xs font-semibold"
                        asChild
                      >
                        <Link href={`/missions/${card.id}`}>View</Link>
                      </Button>
                      <Button size="sm" className="px-3 text-xs font-bold" asChild>
                        <Link href={`/scout/missions/${card.id}`}>Claim</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
