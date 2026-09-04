"use client";

import { useEffect, useState } from "react";
import type { ResearchAnalyticsResult } from "@/lib/research-analytics-service";

export function ResearchAnalyticsDashboard({ missionId }: { missionId: string }) {
  const [analytics, setAnalytics] = useState<ResearchAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/missions/${missionId}/analytics`);
        if (!res.ok) {
          throw new Error("Failed to load analytics");
        }
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [missionId]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
        <div className="mb-4 h-6 w-1/3 rounded bg-[var(--scoutx-muted)]"></div>
        <div className="mb-4 h-20 rounded bg-[var(--scoutx-muted)]"></div>
        <div className="h-20 rounded bg-[var(--scoutx-muted)]"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
        <h3 className="font-semibold">Analytics Error</h3>
        <p className="text-sm">{error || "Data not available"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
      <h3 className="border-b border-[var(--scoutx-border)] pb-4 text-lg font-semibold text-[var(--scoutx-foreground)]">
        Research Analytics
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Completion Progress
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {analytics.overview.completionPercentage.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs text-blue-500">
            {analytics.overview.totalCompleted} / {analytics.overview.totalTarget} completed
          </div>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
          <div className="mb-1 text-sm font-medium text-green-600 dark:text-green-400">
            Quality Score
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {analytics.quality.averageQualityScore.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-green-500">
            Rejection Rate: {analytics.quality.rejectionRate.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">
          <div className="mb-1 text-sm font-medium text-purple-600 dark:text-purple-400">
            Avg Duration
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {(analytics.quality.averageDurationSeconds / 60).toFixed(1)} min
          </div>
          <div className="mt-1 text-xs text-purple-500">
            Across {analytics.quality.totalSubmissions} submissions
          </div>
        </div>
      </div>

      {analytics.quotas.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-[var(--scoutx-foreground)]">
            Quota Fulfillment
          </h4>
          <div className="space-y-4">
            {analytics.quotas.map((quota, idx) => (
              <div key={quota.id} className="text-sm">
                <div className="mb-1 flex justify-between">
                  <span className="capitalize text-[var(--scoutx-muted-foreground)]">
                    Quota {idx + 1}: {JSON.stringify(quota.criteria)}
                  </span>
                  <span className="font-medium text-[var(--scoutx-foreground)]">
                    {quota.completedCount} / {quota.targetCount}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--scoutx-muted)]">
                  <div
                    className="h-2 rounded-full bg-[var(--scoutx-primary)]"
                    style={{ width: `${Math.min(100, quota.fulfillmentPercentage)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.geography.evidencePoints.length > 0 && (
        <div className="mt-6 border-t border-[var(--scoutx-border)] pt-4">
          <h4 className="mb-2 text-sm font-semibold text-[var(--scoutx-foreground)]">
            Geographic Spread
          </h4>
          <p className="mb-3 text-xs text-[var(--scoutx-muted-foreground)]">
            {analytics.geography.evidencePoints.length} geographic data points collected.
          </p>
          <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-muted)]">
            {/* Note: Integrate maplibre-gl map here if needed, currently a placeholder map view */}
            <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/2065/1545.png')] bg-cover bg-center opacity-20"></div>
            <div className="bg-[var(--scoutx-background)]/80 z-10 rounded-full border border-[var(--scoutx-border)] px-3 py-1.5 text-xs font-medium text-[var(--scoutx-foreground)] backdrop-blur-sm">
              Map Visualization Available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
