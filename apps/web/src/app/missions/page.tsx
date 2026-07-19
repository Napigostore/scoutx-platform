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

export default function MissionsPage() {
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

    fetch("/api/missions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch missions");
        }
        setMissions(data.missions || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleSignOut = async () => {
    const token = localStorage.getItem("accessToken");
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    localStorage.removeItem("accessToken");
    router.push("/sign-in");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--scoutx-foreground)]">
            Your Missions
          </h1>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            Manage and track your real-world information requests
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
          <Button asChild>
            <Link href="/missions/new">Create Mission</Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-[var(--scoutx-muted-foreground)]">Loading missions...</p>
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
            No missions found
          </h3>
          <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
            Get started by creating your first real-world discovery mission.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/missions/new">Create Mission</Link>
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
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
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
                  href={`/missions/${mission.id}`}
                  className="text-sm font-semibold text-[var(--scoutx-primary)] hover:underline"
                >
                  View details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
