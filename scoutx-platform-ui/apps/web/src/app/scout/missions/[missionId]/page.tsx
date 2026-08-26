"use client";

import { useEffect, useState, use } from "react";
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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  requiredTags: string[];
  expiresAt: string;
  createdAt: string;
  referenceAttachments?: Array<{
    url: string;
    fileName: string;
    mimeType: string;
    createdAt: string;
  }>;
}

export default function ScoutMissionDetailsPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const router = useRouter();
  const { missionId } = use(params);
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(`/api/scout/missions/${missionId}`, { headers, cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error(
              `Authentication required (HTTP 401): ${data.error || "Session not found"}. Please sign in to view available missions.`,
            );
          }
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

  const handleClaim = async () => {
    if (!confirm("Are you sure you want to claim this mission?")) {
      return;
    }

    setIsClaiming(true);
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/scout/missions/${missionId}/claim`, {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to claim mission");
      }

      setMission(data);
      alert("Mission claimed successfully!");
      router.push(`/scout/missions/${missionId}/work`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsClaiming(false);
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
          <Link href="/scout/missions">Back to Available Missions</Link>
        </Button>
      </div>
    );
  }

  const isClaimable = mission.status === "OPEN" || mission.status === "PUBLISHED";
  const isAssigned =
    mission.status === "MATCHED" ||
    mission.status === "IN_PROGRESS" ||
    mission.status === "SUBMITTED";

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
            <Link href="/scout/missions">Back</Link>
          </Button>
          {isClaimable && (
            <Button onClick={handleClaim} disabled={isClaiming}>
              {isClaiming ? "Claiming..." : "Claim Mission"}
            </Button>
          )}
          {isAssigned && (
            <Button asChild>
              <Link href={`/scout/missions/${mission.id}/work`}>
                {mission.status === "MATCHED"
                  ? "Start Work / Làm nhiệm vụ"
                  : mission.status === "IN_PROGRESS"
                    ? "Continue Work / Tiếp tục làm"
                    : "View Submission / Xem báo cáo"}
              </Link>
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

          {mission.referenceAttachments && mission.referenceAttachments.length > 0 && (
            <div className="rounded-2xl border border-[var(--scoutx-border)] bg-gray-50/70 p-5">
              <h3 className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                📷 Reference photos & videos
              </h3>
              <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
                Uploaded by Requester to clarify scope & instructions.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {mission.referenceAttachments.map((att, idx) => {
                  const isVideo =
                    att.mimeType?.startsWith("video/") || att.fileName.match(/\.(mp4|webm|mov)$/i);

                  return (
                    <div
                      key={att.url || idx}
                      className="overflow-hidden rounded-xl border border-[var(--scoutx-border)] bg-white p-2 shadow-sm"
                    >
                      {isVideo ? (
                        <video
                          controls
                          src={att.url}
                          className="h-32 w-full rounded-lg bg-black object-contain"
                        />
                      ) : (
                        <a href={att.url} target="_blank" rel="noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={att.fileName}
                            className="h-32 w-full rounded-lg object-cover hover:opacity-90"
                          />
                        </a>
                      )}
                      <p className="mt-2 truncate text-center text-[11px] font-medium text-gray-700">
                        {att.fileName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
        </div>

        <div className="space-y-6 rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
              Budget
            </span>
            <p className="mt-1 text-3xl font-bold text-[var(--scoutx-foreground)]">
              {mission.budget.currency?.trim().toUpperCase() === "VND"
                ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    mission.budget.amountCents,
                  )
                : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    mission.budget.amountCents / 100,
                  )}
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
