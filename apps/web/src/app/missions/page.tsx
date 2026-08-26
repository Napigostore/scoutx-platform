"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { formatCurrency } from "@scoutx/application";
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
  participantCount?: number;
  latestMediaUrl?: string | null;
  assignedScout?: {
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
  { id: "ALL", label: "All" },
  { id: "OPEN_MATCHED", label: "Open / Matched" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "VERIFIED", label: "Verified" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" },
];

function MissionsMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams ? searchParams.get("q") || "" : "";

  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<string>("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMissions = async (filter: string, page: number, sort: string, qStr: string) => {
    setIsLoading(true);
    setError("");

    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      let url = `/api/missions?status=${encodeURIComponent(filter)}&page=${page}&limit=20&sort=${encodeURIComponent(sort)}`;
      if (qStr && qStr.trim().length > 0) {
        url += `&q=${encodeURIComponent(qStr.trim())}`;
      }

      const res = await fetch(url, { headers, cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in?callbackUrl=/missions");
          return;
        }
        throw new Error(data.error || "Failed to fetch missions");
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
    fetchMissions(activeFilter, currentPage, sortOrder, appliedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, currentPage, sortOrder, appliedQuery]);

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    setAppliedQuery(trimmed);
    setCurrentPage(1);

    if (typeof window !== "undefined") {
      const newUrl = trimmed
        ? `/missions?q=${encodeURIComponent(trimmed)}&status=${activeFilter}&sort=${sortOrder}`
        : `/missions?status=${activeFilter}&sort=${sortOrder}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedQuery("");
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/missions?status=${activeFilter}&sort=${sortOrder}`);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers,
    });
    localStorage.removeItem("accessToken");
    router.push("/sign-in");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--scoutx-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--scoutx-primary)]">
            Global Field Intelligence Platform
          </span>
          <h1 className="font-display mt-1 text-3xl font-black text-[var(--scoutx-foreground)] sm:text-4xl">
            MISSION MARKETPLACE
          </h1>
          <p className="mt-1 text-sm text-[var(--scoutx-muted-foreground)]">
            Explore live field verification bounties, claim tasks, or launch on-site intelligence
            requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
          <Button asChild>
            <Link href="/missions/new">➕ Launch New Mission</Link>
          </Button>
        </div>
      </div>

      {/* Search & Discovery Filter Bar */}
      <div className="mt-6 space-y-4">
        {/* Search Bar Input & Action Button */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(e);
                }
              }}
              placeholder="Search missions by title, description, category, tags..."
              className="w-full rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-5 py-3 pl-12 pr-10 text-sm text-[var(--scoutx-foreground)] placeholder-[var(--scoutx-muted-foreground)] shadow-sm focus:border-[var(--scoutx-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
            />
            <span className="absolute left-4 top-3 text-lg">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-3.5 text-xs font-bold text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-2xl px-6 py-3 font-bold shadow-md min-w-[100px]"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* Applied Search Badge Indicator */}
        {appliedQuery && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
            <span>Filtering results for:</span>
            <span className="rounded-full bg-[var(--scoutx-primary)]/10 px-3 py-1 font-bold text-[var(--scoutx-primary)]">
              &quot;{appliedQuery}&quot;
            </span>
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Filter Tabs & Sort Control */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
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
            <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Sort by:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-1.5 text-xs font-bold text-[var(--scoutx-foreground)] focus:outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="popular">Popular</option>
              <option value="newest">Newest</option>
              <option value="highest_bounty">Highest Bounty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-semibold text-[var(--scoutx-muted-foreground)] animate-pulse">
            Searching & loading missions...
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
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-8 text-center mt-6">
          <h3 className="font-display text-lg font-semibold text-[var(--scoutx-foreground)]">
            {appliedQuery ? `No missions match "${appliedQuery}"` : "No missions found"}
          </h3>
          <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)] max-w-sm">
            {appliedQuery
              ? "Try adjusting your search query or clear filters to view all available field missions."
              : "No missions matching the selected status filter."}
          </p>
          {appliedQuery && (
            <Button variant="outline" size="sm" onClick={handleClearSearch} className="mt-4">
              Clear Search Query
            </Button>
          )}
        </div>
      )}

      {/* Missions Grid */}
      {!isLoading && !error && missions.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => (
            <Link
              key={mission.id}
              href={`/missions/${mission.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--scoutx-primary)] hover:shadow-md"
            >
              <div>
                {/* Image thumbnail if available */}
                {mission.latestMediaUrl && (
                  <div className="mb-3 h-36 w-full overflow-hidden rounded-xl bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mission.latestMediaUrl}
                      alt={mission.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--scoutx-muted)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--scoutx-muted-foreground)] uppercase">
                    {mission.category.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {mission.participantCount !== undefined && mission.participantCount > 0 && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        👥 {mission.participantCount} người đang tham gia
                      </span>
                    )}
                    <MissionStatusBadge status={mission.status} />
                  </div>
                </div>

                <h3 className="font-display mt-3 text-lg font-bold text-[var(--scoutx-foreground)] group-hover:text-[var(--scoutx-primary)] line-clamp-2">
                  {mission.title}
                </h3>

                <p className="mt-2 text-xs text-[var(--scoutx-muted-foreground)] line-clamp-3">
                  {mission.description}
                </p>
              </div>

              <div className="mt-5 border-t border-[var(--scoutx-border)] pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[var(--scoutx-muted-foreground)] block">
                    Bounty Reward
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(mission.budget.amountCents, mission.budget.currency)}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--scoutx-primary)] group-hover:underline">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-[var(--scoutx-border)] pt-6">
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Showing page <span className="font-bold">{pagination.page}</span> of{" "}
            <span className="font-bold">{pagination.totalPages}</span> ({pagination.total} total missions)
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <p className="text-sm font-semibold text-[var(--scoutx-muted-foreground)]">
            Loading Missions Marketplace...
          </p>
        </div>
      }
    >
      <MissionsMarketplaceContent />
    </Suspense>
  );
}
