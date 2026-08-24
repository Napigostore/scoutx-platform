"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@scoutx/ui";

interface Mission {
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
}

export default function ScoutMissionsPage() {
  const router = useRouter();
  const [assignedMissions, setAssignedMissions] = useState<Mission[]>([]);
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<"assigned" | "available">("assigned");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    Promise.all([
      fetch("/api/scout/missions/assigned", { headers, cache: "no-store" }).then(async (res) => {
        if (!res.ok) return { missions: [] };
        return res.json();
      }),
      fetch("/api/scout/missions", { headers, cache: "no-store" }).then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/sign-in?callbackUrl=/scout/missions");
            return { missions: [] };
          }
          return { missions: [] };
        }
        return res.json();
      }),
    ])
      .then(([assignedData, availableData]) => {
        const assigned = assignedData.missions || [];
        const available = availableData.missions || [];
        setAssignedMissions(assigned);
        setAvailableMissions(available);
        if (assigned.length === 0 && available.length > 0) {
          setActiveTab("available");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleSignOut = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    router.push("/sign-in");
  };

  const displayedMissions = activeTab === "assigned" ? assignedMissions : availableMissions;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[var(--scoutx-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--scoutx-foreground)]">
            Scout Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            Manage your claimed missions and discover new information requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="mt-6 border-b border-[var(--scoutx-border)]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === "assigned"
                ? "border-[var(--scoutx-primary)] text-[var(--scoutx-primary)]"
                : "border-transparent text-[var(--scoutx-muted-foreground)] hover:border-gray-300 hover:text-[var(--scoutx-foreground)]"
            }`}
          >
            Nhiệm vụ đã nhận ({assignedMissions.length})
          </button>

          <button
            onClick={() => setActiveTab("available")}
            className={`border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === "available"
                ? "border-[var(--scoutx-primary)] text-[var(--scoutx-primary)]"
                : "border-transparent text-[var(--scoutx-muted-foreground)] hover:border-gray-300 hover:text-[var(--scoutx-foreground)]"
            }`}
          >
            Khám phá nhiệm vụ ({availableMissions.length})
          </button>
        </nav>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-[var(--scoutx-muted-foreground)]">Loading dashboard missions...</p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && displayedMissions.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--scoutx-border)] p-8 text-center">
          <h3 className="font-display text-lg font-semibold text-[var(--scoutx-foreground)]">
            {activeTab === "assigned" ? "Chưa có nhiệm vụ đã nhận" : "Chưa có nhiệm vụ mới"}
          </h3>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            {activeTab === "assigned"
              ? "Chuyển sang tab Khám phá nhiệm vụ để nhận nhiệm vụ mới."
              : "Quay lại sau để cập nhật nhiệm vụ mới."}
          </p>
          {activeTab === "assigned" && (
            <Button className="mt-4" onClick={() => setActiveTab("available")}>
              Khám phá nhiệm vụ ngay
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && displayedMissions.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedMissions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => {
                if (activeTab === "assigned") {
                  router.push(`/scout/missions/${mission.id}/work`);
                } else {
                  router.push(`/scout/missions/${mission.id}`);
                }
              }}
              className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm transition-shadow hover:border-[var(--scoutx-primary)] hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {mission.status}
                  </span>
                  <span className="text-sm font-semibold text-[var(--scoutx-primary)]">
                    {mission.budget.currency?.trim().toUpperCase() === "VND"
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
                <h3 className="font-display mt-4 text-lg font-bold text-[var(--scoutx-foreground)] group-hover:text-[var(--scoutx-primary)]">
                  {mission.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--scoutx-muted-foreground)]">
                  {mission.description}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[var(--scoutx-border)] pt-4">
                <span className="text-xs text-[var(--scoutx-muted-foreground)]">
                  Created {new Date(mission.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {activeTab === "assigned" ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/scout/missions/${mission.id}/work`);
                      }}
                    >
                      Làm nhiệm vụ &rarr;
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/scout/missions/${mission.id}`);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
