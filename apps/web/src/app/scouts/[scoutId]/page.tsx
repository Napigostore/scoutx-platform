"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { formatCurrency as formatRewardCurrency } from "@scoutx/application";

interface ScoutDetail {
  id: string;
  userId: string;
  name: string;
  bio: string;
  avatarUrl?: string | null;
  reputation: number;
  reliabilityScore: number;
  completedMissions: number;
  successRate: number;
  responseRate: number;
  totalEarnedCents: number;
  location: string;
  availability: string;
  categories: string[];
  tags: string[];
  memberSince: string;
  badges: Array<{ id: string; label: string; icon: string; desc: string }>;
  recentActivity: Array<{
    id: string;
    missionId: string;
    title: string;
    category: string;
    summary: string;
    verified: boolean;
    date: string;
  }>;
}

export default function ScoutProfilePage({ params }: { params: Promise<{ scoutId: string }> }) {
  const { scoutId } = use(params);
  const [scout, setScout] = useState<ScoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/scouts/${scoutId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load scout profile");
        }
        setScout(json.scout);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [scoutId]);

  const formatCurrency = (cents: number) => {
    return formatRewardCurrency(cents, "USD");
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-[var(--scoutx-background)]">
        <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
          Loading field operator profile...
        </p>
      </div>
    );
  }

  if (error || !scout) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          <p className="font-bold">Scout profile not found</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
        <Button className="mt-6" asChild>
          <Link href="/scouts">Back to Top Scouters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--scoutx-background)] py-12">
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div>
          <Link
            href="/scouts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-primary)]"
          >
            ← Back to Leaderboards
          </Link>
        </div>

        {/* HERO CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-8 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 p-1 shadow-2xl">
              <div className="font-display flex h-full w-full items-center justify-center rounded-full bg-[var(--scoutx-card)] text-3xl font-black text-[var(--scoutx-primary)]">
                {scout.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--scoutx-card)] bg-emerald-500 text-xs font-bold text-white">
                ✓
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-[var(--scoutx-primary)]">
                  🛡️ Certified Field Operator
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                  ★ {scout.reputation} Reputation
                </span>
              </div>

              <h1 className="font-display text-3xl font-black text-[var(--scoutx-foreground)] sm:text-4xl">
                {scout.name}
              </h1>

              <p className="max-w-2xl text-sm text-[var(--scoutx-muted-foreground)]">{scout.bio}</p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-medium text-[var(--scoutx-muted-foreground)] md:justify-start">
                <span>📍 {scout.location}</span>
                <span>•</span>
                <span>📅 Active since {new Date(scout.memberSince).toLocaleDateString()}</span>
                <span>•</span>
                <span className="font-bold text-emerald-500">🟢 {scout.availability}</span>
              </div>
            </div>
          </div>

          {/* STATS METRICS GRID */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--scoutx-border)] pt-8 sm:grid-cols-4">
            <div className="bg-[var(--scoutx-muted)]/30 rounded-2xl border border-[var(--scoutx-border)] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                Missions Done
              </span>
              <p className="font-display mt-1 text-2xl font-black text-[var(--scoutx-foreground)]">
                {scout.completedMissions}
              </p>
            </div>

            <div className="bg-[var(--scoutx-muted)]/30 rounded-2xl border border-[var(--scoutx-border)] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                Pass Rate
              </span>
              <p className="font-display mt-1 text-2xl font-black text-emerald-500">
                {scout.successRate}%
              </p>
            </div>

            <div className="bg-[var(--scoutx-muted)]/30 rounded-2xl border border-[var(--scoutx-border)] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                Response Rate
              </span>
              <p className="font-display mt-1 text-2xl font-black text-amber-500">
                {scout.responseRate}%
              </p>
            </div>

            <div className="bg-[var(--scoutx-muted)]/30 rounded-2xl border border-[var(--scoutx-border)] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                Total Bounties
              </span>
              <p className="font-display mt-1 text-xl font-black text-[var(--scoutx-primary)]">
                {formatCurrency(scout.totalEarnedCents)}
              </p>
            </div>
          </div>
        </div>

        {/* BADGES & CREDENTIALS SECTION */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--scoutx-foreground)]">
            Verified Badges & Credentials
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {scout.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--scoutx-muted)] text-2xl">
                  {badge.icon}
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[var(--scoutx-foreground)]">
                    {badge.label}
                  </h3>
                  <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY & SUBMISSIONS */}
        <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-lg">
          <h2 className="font-display mb-4 text-xl font-bold text-[var(--scoutx-foreground)]">
            Recent On-Site Verification Activity
          </h2>

          {scout.recentActivity.length === 0 ? (
            <p className="text-xs italic text-[var(--scoutx-muted-foreground)]">
              No public verification history yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--scoutx-border)]">
              {scout.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-[var(--scoutx-foreground)]">
                        {act.title}
                      </span>
                      {act.verified && (
                        <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--scoutx-muted-foreground)]">
                      {act.summary}
                    </p>
                  </div>

                  <div className="shrink-0 text-xs text-[var(--scoutx-muted-foreground)]">
                    {new Date(act.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
