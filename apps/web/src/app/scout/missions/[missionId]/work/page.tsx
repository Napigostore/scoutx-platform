"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@scoutx/ui";

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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  requiredTags: string[];
  expiresAt: string;
  createdAt: string;
}

export default function ScoutMissionWorkPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const router = useRouter();
  const { missionId } = use(params);
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [summary, setSummary] = useState("");
  const [mediaUrls, setMediaUrls] = useState(
    "https://example.com/evidence1.jpg, https://example.com/evidence2.jpg",
  );
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    fetch(`/api/scout/missions/${missionId}/assignment`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch mission details");
        }
        setMission(data);
        setLatitude(data.coordinates.latitude.toString());
        setLongitude(data.coordinates.longitude.toString());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [missionId, router]);

  const handleStart = async () => {
    setIsStarting(true);
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`/api/scout/missions/${missionId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start mission");
      }

      setMission(data);
      alert("Mission started! You can now submit your report.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Latitude and Longitude must be valid numbers");
      setIsSubmitting(false);
      return;
    }

    const urls = mediaUrls
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const payload = {
      summary,
      mediaUrls: urls,
      latitude: lat,
      longitude: lng,
    };

    try {
      const res = await fetch(`/api/scout/missions/${missionId}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit mission");
      }

      alert("Mission report submitted successfully!");
      router.push("/scout/missions/assigned");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-[var(--scoutx-muted-foreground)]">Loading mission details...</p>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error || "Mission not found"}
        </div>
        <Button className="mt-4" asChild>
          <Link href="/scout/missions/assigned">Back to Assigned Missions</Link>
        </Button>
      </div>
    );
  }

  const isMatched = mission.status === "MATCHED";
  const isInProgress = mission.status === "IN_PROGRESS";
  const isSubmitted = mission.status === "SUBMITTED";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {mission.status}
            </span>
            <span className="text-sm text-[var(--scoutx-muted-foreground)]">
              Category: {mission.category}
            </span>
          </div>
          <h1 className="font-display mt-3 text-3xl font-bold text-[var(--scoutx-foreground)]">
            {mission.title}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/scout/missions/assigned">Back</Link>
          </Button>
          {isMatched && (
            <Button onClick={handleStart} disabled={isStarting}>
              {isStarting ? "Starting..." : "Start Mission"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div>
            <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--scoutx-muted-foreground)]">
              {mission.description}
            </p>
          </div>

          {isInProgress && (
            <div className="rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">
                Submit Mission Report
              </h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary / Findings</Label>
                  <textarea
                    id="summary"
                    required
                    rows={4}
                    className="flex w-full rounded-md border border-[var(--scoutx-border)] bg-white px-3 py-2 text-sm placeholder-[var(--scoutx-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                    placeholder="Describe what you observed on-site..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mediaUrls">Evidence Image URLs (comma separated)</Label>
                  <Input
                    id="mediaUrls"
                    required
                    value={mediaUrls}
                    onChange={(e) => setMediaUrls(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Observed Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Observed Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting Report..." : "Submit Report"}
                </Button>
              </form>
            </div>
          )}

          {isSubmitted && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
              <h3 className="text-lg font-semibold">Report Submitted Successfully!</h3>
              <p className="mt-2 text-sm">
                Your report has been submitted and is currently awaiting review by the requester.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
              Budget
            </span>
            <p className="mt-1 text-3xl font-bold text-[var(--scoutx-foreground)]">
              \${(mission.budget.amountCents / 100).toFixed(2)}
            </p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
              Urgency
            </span>
            <p className="mt-1 font-semibold text-[var(--scoutx-foreground)]">{mission.urgency}</p>
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
              Expires At
            </span>
            <p className="mt-1 text-sm text-[var(--scoutx-foreground)]">
              {new Date(mission.expiresAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
