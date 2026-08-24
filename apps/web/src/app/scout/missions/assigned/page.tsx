"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { MissionStatusBadge } from "@/components/MissionStatusBadge";

interface MissionSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: string;
  budget: {
    amountCents: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  lastActivitySummary: string;
  evidenceCount: number;
  latestMediaUrl?: string | null;
  requester?: {
    id: string;
    displayName: string;
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { id: "ALL", label: "Tất cả" },
  { id: "OPEN_MATCHED", label: "Matched" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "VERIFIED", label: "Verified" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" },
];

export default function ScoutAssignedMissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"last_activity_desc" | "created_at_desc">(
    "last_activity_desc",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMissions = async (filter: string, page: number, sort: string) => {
    setIsLoading(true);
    setError("");

    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const url = `/api/scout/missions/assigned?status=${encodeURIComponent(filter)}&page=${page}&limit=20&sort=${encodeURIComponent(sort)}`;
      const res = await fetch(url, { headers, cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in?callbackUrl=/scout/missions/assigned");
          return;
        }
        throw new Error(data.error || "Failed to fetch assigned missions");
      }

      setMissions(data.missions || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions(activeFilter, currentPage, sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, currentPage, sortOrder]);

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--scoutx-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--scoutx-foreground)]">
            My Assigned Missions
          </h1>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            Quản lý và cập nhật báo cáo thực địa cho các nhiệm vụ bạn đã nhận
          </p>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link href="/scout/missions">🔍 Khám Phá Nhiệm Vụ Mới</Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Sort Control */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === tab.id
                  ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
                  : "bg-[var(--scoutx-muted)] text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-secondary)] hover:text-[var(--scoutx-foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--scoutx-muted-foreground)]">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "last_activity_desc" | "created_at_desc")
            }
            className="rounded-lg border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-2.5 py-1.5 text-xs font-medium text-[var(--scoutx-foreground)] focus:outline-none"
          >
            <option value="last_activity_desc">Mới cập nhật nhất</option>
            <option value="created_at_desc">Mới nhận nhất</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-[var(--scoutx-muted-foreground)]">
            Đang tải danh sách nhiệm vụ được giao...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && missions.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-8 text-center">
          <h3 className="font-display text-lg font-semibold text-[var(--scoutx-foreground)]">
            {activeFilter === "ALL"
              ? "Bạn chưa được giao nhiệm vụ nào."
              : "Không có nhiệm vụ phù hợp."}
          </h3>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            {activeFilter === "ALL"
              ? "Chuyển đến trang khám phá để nhận nhiệm vụ thực địa đầu tiên."
              : "Thử thay đổi bộ lọc trạng thái để tìm nhiệm vụ khác."}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/scout/missions">🔍 Khám Phá Nhiệm Vụ Mới</Link>
          </Button>
        </div>
      )}

      {/* Mission Cards Grid */}
      {!isLoading && !error && missions.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm transition-all hover:border-[var(--scoutx-primary)] hover:shadow-md"
            >
              <div>
                {/* Header: Status & Price */}
                <div className="flex items-center justify-between gap-2">
                  <MissionStatusBadge status={mission.status} />
                  <span className="text-sm font-bold text-[var(--scoutx-primary)]">
                    {mission.budget.currency.toUpperCase() === "VND"
                      ? new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(mission.budget.amountCents)
                      : new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(mission.budget.amountCents / 100)}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-display mt-4 text-lg font-bold text-[var(--scoutx-foreground)] group-hover:text-[var(--scoutx-primary)]">
                  {mission.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs text-[var(--scoutx-muted-foreground)] sm:text-sm">
                  {mission.description}
                </p>

                {/* Requester Badge */}
                <div className="bg-[var(--scoutx-muted)]/60 mt-4 flex items-center justify-between rounded-xl px-3 py-2 text-xs">
                  <span className="text-[var(--scoutx-muted-foreground)]">Requester:</span>
                  <span className="font-semibold text-[var(--scoutx-foreground)]">
                    👤 {mission.requester?.displayName || "Requester"}
                  </span>
                </div>

                {/* Latest Media Thumbnail (if present) */}
                {mission.latestMediaUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[var(--scoutx-border)] bg-black/5 dark:bg-black/40">
                    {mission.latestMediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video src={mission.latestMediaUrl} className="h-28 w-full object-cover" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={mission.latestMediaUrl}
                        alt="Latest media"
                        className="h-28 w-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Latest Activity Summary Banner */}
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-[11px] text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200">
                  <span className="font-semibold">Hoạt động gần nhất:</span>{" "}
                  <span className="line-clamp-1">{mission.lastActivitySummary}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-[var(--scoutx-border)] pt-4">
                <div className="flex items-center gap-3 text-xs text-[var(--scoutx-muted-foreground)]">
                  <span>📷 {mission.evidenceCount} file</span>
                  <span>•</span>
                  <span>{new Date(mission.lastActivityAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <Link
                  href={`/scout/missions/${mission.id}/work`}
                  className="text-xs font-bold text-[var(--scoutx-primary)] hover:underline"
                >
                  Thực hiện &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-[var(--scoutx-border)] pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            &larr; Trang trước
          </Button>
          <span className="text-xs text-[var(--scoutx-muted-foreground)]">
            Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} nhiệm vụ)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pagination.totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
          >
            Trang sau &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
