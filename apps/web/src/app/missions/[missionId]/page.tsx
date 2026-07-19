"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@scoutx/ui";

interface Submission {
  id: string;
  summary: string;
  mediaUrls: string[];
  observedAt: string;
  latitude: number;
  longitude: number;
}

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
  submission?: Submission | null;
}

export default function MissionDetailsPage({ params }: { params: Promise<{ missionId: string }> }) {
  const router = useRouter();
  const { missionId } = use(params);
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    fetch(`/api/missions/${missionId}`, {
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
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [missionId, router]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this mission?")) {
      return;
    }

    setIsCancelling(true);
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`/api/missions/${missionId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel mission");
      }

      setMission(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish this mission?")) {
      return;
    }

    setIsPublishing(true);
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`/api/missions/${missionId}/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish mission");
      }

      setMission(data);
      alert("Mission published successfully!");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPublishing(false);
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
          <Link href="/missions">Back to Missions</Link>
        </Button>
      </div>
    );
  }

  const isEditable = mission.status === "DRAFT";
  const isCancellable = mission.status === "DRAFT" || mission.status === "PUBLISHED";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
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
            <Link href="/missions">Back</Link>
          </Button>
          {isEditable && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/missions/${mission.id}/edit`}>Edit</Link>
              </Button>
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </>
          )}
          {isCancellable && (
            <Button
              variant="secondary"
              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Mission"}
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

          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-gray-50 p-6">
            <h3 className="text-sm font-semibold text-[var(--scoutx-foreground)]">
              Location Details
            </h3>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-[var(--scoutx-muted-foreground)]">Coordinates:</span>
                <p className="font-medium text-[var(--scoutx-foreground)]">
                  {mission.coordinates.latitude.toFixed(6)},{" "}
                  {mission.coordinates.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-[var(--scoutx-muted-foreground)]">Radius:</span>
                <p className="font-medium text-[var(--scoutx-foreground)]">
                  {mission.radiusMeters} meters
                </p>
              </div>
            </div>
          </div>

          {mission.submission && (
            <div className="space-y-4 rounded-2xl border border-green-200 bg-green-50/30 p-6">
              <h3 className="text-lg font-semibold text-green-900">
                Submission Report (Read-Only)
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-green-800">Summary / Findings:</span>
                  <p className="mt-1 whitespace-pre-wrap text-gray-700">
                    {mission.submission.summary}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-green-800">Observed Coordinates:</span>
                  <p className="mt-1 text-gray-700">
                    {mission.submission.latitude.toFixed(6)},{" "}
                    {mission.submission.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-green-800">Observed At:</span>
                  <p className="mt-1 text-gray-700">
                    {new Date(mission.submission.observedAt).toLocaleString()}
                  </p>
                </div>
                {mission.submission.mediaUrls.length > 0 && (
                  <div>
                    <span className="font-semibold text-green-800">Evidence Images:</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {mission.submission.mediaUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Evidence"
                          className="max-h-48 rounded-lg border border-green-100 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
              Budget
            </span>
            <p className="mt-1 text-3xl font-bold text-[var(--scoutx-foreground)]">
              ${(mission.budget.amountCents / 100).toFixed(2)}
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

          {mission.requiredTags.length > 0 && (
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
                Required Tags
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {mission.requiredTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
