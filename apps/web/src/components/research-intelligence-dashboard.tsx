/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";

interface ResearchIntelligenceDashboardProps {
  missionId: string;
}

interface IntelligenceData {
  metrics: {
    totalTarget: number;
    completedCount: number;
    completionRate: number;
    acceptanceRate: number;
    abandonmentRate: number;
    averageQualityScore: number;
    medianDurationSeconds: number;
    costPerComplete: number;
    recruitmentVelocityPerHour: number;
    remainingBudget: number;
  };
  healthScore: {
    overallScore: number;
    grade: "HEALTHY" | "WARNING" | "CRITICAL";
  };
  alerts: Array<{
    code: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
  }>;
  anomalies: Array<{
    id: string;
    type: string;
    severity: string;
    score: number;
    status: string;
    createdAt: string;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    rationale: string;
    status: string;
  }>;
  aiInsight?: {
    summary: string;
    findings: string[];
    confidence: number;
    severity: string;
  };
}

export function ResearchIntelligenceDashboard({ missionId }: ResearchIntelligenceDashboardProps) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        const res = await fetch(`/api/missions/${missionId}/intelligence`);
        if (!res.ok) {
          throw new Error(`Failed to load intelligence data: ${res.statusText}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load intelligence");
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, [missionId]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="font-semibold">Unable to load intelligence dashboard</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const { metrics, healthScore, alerts, anomalies, recommendations, aiInsight } = data;

  const healthBadgeColor =
    healthScore.grade === "HEALTHY"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400"
      : healthScore.grade === "WARNING"
        ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400"
        : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400";

  const healthDot =
    healthScore.grade === "HEALTHY"
      ? "🟢 Healthy"
      : healthScore.grade === "WARNING"
        ? "🟠 Warning"
        : "🔴 Critical";

  return (
    <div className="space-y-6">
      {/* Top Header & Health Score */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Research Intelligence
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Realtime quality monitoring, fraud anomaly detection & panel velocity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${healthBadgeColor}`}
          >
            {healthDot} ({healthScore.overallScore}/100)
          </span>
        </div>
      </div>

      {/* 6 Key Performance Indicators */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Quality Score
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.averageQualityScore}
            <span className="ml-1 text-xs font-normal text-slate-400">/100</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Completion</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.completionRate}%
            <span className="ml-1 text-xs font-normal text-slate-400">
              ({metrics.completedCount}/{metrics.totalTarget})
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Acceptance</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.acceptanceRate}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Abandonment</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics.abandonmentRate}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Median Time</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {Math.round(metrics.medianDurationSeconds / 60)}
            <span className="ml-1 text-xs font-normal text-slate-400">min</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Cost / Complete
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.costPerComplete}
            <span className="ml-1 text-xs font-normal text-slate-400">coins</span>
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            Active Quality Alerts
          </h3>
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400"
              >
                <span>
                  {a.severity === "CRITICAL" ? "🔴" : a.severity === "HIGH" ? "🟠" : "🟡"}
                </span>
                <span className="font-semibold">[{a.code}]</span>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights & Recommendations */}
      {aiInsight && (
        <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
              AI Panel Intelligence Insights (Advisory Only)
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">
              Confidence: {Math.round(aiInsight.confidence * 100)}%
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{aiInsight.summary}</p>
          {aiInsight.findings.length > 0 && (
            <ul className="list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {aiInsight.findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recommendations & Anomalies Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Open Anomalies */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Detected Anomalies
          </h3>
          {anomalies.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No active anomalies detected.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {anomalies.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {a.type}
                    </span>
                    <span className="ml-2 text-slate-400">Score: {a.score}</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      a.severity === "CRITICAL"
                        ? "bg-red-100 text-red-800"
                        : a.severity === "HIGH"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Recommendations */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Proposed Recommendations
          </h3>
          {recommendations.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No pending recommendations.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recommendations.map((r) => (
                <div key={r.id} className="space-y-1 py-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {r.type}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] ${
                        r.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "REJECTED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
