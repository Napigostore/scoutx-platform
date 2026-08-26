"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HomeMissionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  createdAt: string;
  budgetCents: number;
  currency: string;
  rewardDisplay: string;
  difficulty: string;
  difficultyLabel: string;
  participantCount: number;
  thumbnailUrl?: string | null;
}

export interface HomeMissionsData {
  latest: HomeMissionItem[];
  highestPaid: HomeMissionItem[];
  mostParticipated: HomeMissionItem[];
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now();
    const created = new Date(dateStr).getTime();
    const diffMins = Math.floor((now - created) / (1000 * 60));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  } catch {
    return dateStr;
  }
}

export function Live3ColumnMissionsSection() {
  const [data, setData] = useState<HomeMissionsData>({
    latest: [],
    highestPaid: [],
    mostParticipated: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHomeMissions() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/missions/live", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "Không thể tải dữ liệu nhiệm vụ live");
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message || "Lỗi kết nối máy chủ");
      } finally {
        setIsLoading(false);
      }
    }

    fetchHomeMissions();
  }, []);

  const renderMissionRow = (item: HomeMissionItem, rankIndex: number, type: "latest" | "highest" | "participants") => {
    return (
      <Link
        key={`${type}-${item.id}`}
        href={`/missions/${item.id}`}
        className="group relative flex items-center justify-between gap-3 rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3.5 shadow-sm transition-all hover:border-[var(--scoutx-primary)] hover:bg-[var(--scoutx-accent)] hover:shadow-md"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Rank or Thumbnail */}
          {item.thumbnailUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--scoutx-border)] bg-zinc-900">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-emerald-400 border border-zinc-700">
              #{rankIndex + 1}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-[var(--scoutx-foreground)] group-hover:text-[var(--scoutx-primary)]">
              {item.title}
            </h4>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--scoutx-muted-foreground)]">
              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 border border-zinc-700">
                {item.category.replace(/_/g, " ")}
              </span>

              {type === "latest" && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  {formatRelativeTime(item.createdAt)}
                </span>
              )}

              {type === "participants" && (
                <span className="flex items-center gap-1 font-semibold text-blue-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {item.participantCount} scouts
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reward USD Badge */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-black text-emerald-400 font-mono">
            {item.rewardDisplay}
          </span>
          <span className="text-[10px] text-[var(--scoutx-muted-foreground)] uppercase tracking-wider font-semibold">
            {item.difficulty}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <section className="border-t border-[var(--scoutx-border)] bg-[var(--scoutx-background)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
            Live Network Matrix
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[var(--scoutx-foreground)] sm:text-4xl">
            SCOUTX MISSION MATRIX
          </h2>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)] sm:text-base max-w-2xl">
            Theo dõi trực tiếp các nhiệm vụ thực tế trên hệ thống production ScoutX theo thời gian thực.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-4 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5">
                <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="h-14 animate-pulse rounded-xl bg-zinc-800/60" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-red-500/20 px-4 py-1.5 text-xs font-bold hover:bg-red-500/30"
            >
              Tải lại trang
            </button>
          </div>
        )}

        {/* Main 3 Columns Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* COLUMN 1: TOP 10 MISSION MỚI NHẤT */}
            <div className="flex flex-col space-y-4 rounded-2xl border border-blue-500/20 bg-blue-950/10 p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🆕</span>
                  <div>
                    <h3 className="text-base font-bold text-blue-400 uppercase tracking-wide">
                      TOP 10 MỚI NHẤT
                    </h3>
                    <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">
                      Nhiệm vụ vừa tạo theo thời gian thực
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">
                  {data.latest.length}
                </span>
              </div>

              {data.latest.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--scoutx-muted-foreground)]">
                  Chưa có nhiệm vụ mới nào
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.latest.map((item, idx) => renderMissionRow(item, idx, "latest"))}
                </div>
              )}
            </div>

            {/* COLUMN 2: TOP 10 TRẢ PHÍ CAO NHẤT */}
            <div className="flex flex-col space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <div>
                    <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wide">
                      TOP 10 THƯỞNG CAO NHẤT
                    </h3>
                    <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">
                      Xếp theo mức thưởng USD lớn nhất
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {data.highestPaid.length}
                </span>
              </div>

              {data.highestPaid.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--scoutx-muted-foreground)]">
                  Chưa có dữ liệu thưởng
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.highestPaid.map((item, idx) => renderMissionRow(item, idx, "highest"))}
                </div>
              )}
            </div>

            {/* COLUMN 3: TOP 10 NGUỜI THAM GIA NHIỀU NHẤT */}
            <div className="flex flex-col space-y-4 rounded-2xl border border-purple-500/20 bg-purple-950/10 p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <h3 className="text-base font-bold text-purple-400 uppercase tracking-wide">
                      TOP 10 NGUỜI THAM GIA
                    </h3>
                    <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">
                      Xếp theo lượt Scout tương tác & claim
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-300">
                  {data.mostParticipated.length}
                </span>
              </div>

              {data.mostParticipated.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--scoutx-muted-foreground)]">
                  Chưa có dữ liệu tham gia
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.mostParticipated.map((item, idx) => renderMissionRow(item, idx, "participants"))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
