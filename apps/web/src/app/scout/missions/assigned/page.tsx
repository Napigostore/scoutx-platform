"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function ScoutAssignedMissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    fetch("/api/scout/missions/assigned", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch assigned missions");
        }
        setMissions(data.missions || []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--scoutx-foreground)]">
            Your Assigned Missions
          </h1>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            Track and submit reports for missions you have claimed
          </p>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link href="/scout/missions">Discover Missions</Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-[var(--scoutx-muted-foreground)]">Loading assigned missions...</p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && missions.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--scoutx-border)] p-8 text-center">
          <h3 className="font-display text-lg font-semibold text-[var(--scoutx-foreground)]">
            No assigned missions
          </h3>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            Go to the discovery page to find and claim missions.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/scout/missions">Discover Missions</Link>
          </Button>
        </div>
      )}

      {!isLoading && !error && missions.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {mission.status}
                  </span>
                  <span className="text-sm font-semibold text-[var(--scoutx-primary)]">
                    ${(mission.budget.amountCents / 100).toFixed(2)}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-lg font-bold text-[var(--scoutx-foreground)]">
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
                <Link
                  href={`/scout/missions/${mission.id}/work`}
                  className="text-sm font-semibold text-[var(--scoutx-primary)] hover:underline"
                >
                  Start Work &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
