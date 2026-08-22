"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@scoutx/ui";
import { ScoutLivestreamBroadcaster } from "@/components/ScoutLivestreamBroadcaster";

interface Submission {
  id: string;
  summary: string;
  mediaUrls: string[];
  observedAt: string;
  latitude: number;
  longitude: number;
  verified?: boolean;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
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
}

export default function ScoutMissionWorkPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const router = useRouter();
  const { missionId } = use(params);
  const [mission, setMission] = useState<Mission | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [summary, setSummary] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 16));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchData = async () => {
    const headers = getHeaders();

    try {
      // Fetch mission assignment
      const missionRes = await fetch(`/api/scout/missions/${missionId}/assignment`, {
        headers,
        cache: "no-store",
      });
      const missionData = await missionRes.json();
      if (!missionRes.ok) {
        if (missionRes.status === 401) {
          router.push(`/sign-in?callbackUrl=/scout/missions/${missionId}/work`);
          return;
        }
        throw new Error(missionData.error || "Failed to fetch mission details");
      }
      setMission(missionData);
      setLatitude((missionData.coordinates?.latitude ?? "").toString());
      setLongitude((missionData.coordinates?.longitude ?? "").toString());

      // Fetch submission data
      const subRes = await fetch(`/api/missions/${missionId}`, {
        headers,
        cache: "no-store",
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.submission) {
          setSubmission(subData.submission);
          setSummary(subData.submission.summary || "");
          setMediaUrls(subData.submission.mediaUrls || []);
          setLatitude((subData.submission.latitude ?? "").toString());
          setLongitude((subData.submission.longitude ?? "").toString());
          if (subData.submission.observedAt) {
            setObservedAt(new Date(subData.submission.observedAt).toISOString().slice(0, 16));
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, router]);

  const handleStart = async () => {
    setIsStarting(true);
    const headers = getHeaders();

    try {
      const res = await fetch(`/api/scout/missions/${missionId}/start`, {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    const headers = getHeaders();

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("missionId", missionId);

        const res = await fetch("/api/evidence/upload", {
          method: "POST",
          headers,
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        const fileUrl =
          data.url ||
          (data.storageKey
            ? `/api/evidence/download?key=${encodeURIComponent(data.storageKey)}`
            : null);
        if (fileUrl) {
          newUrls.push(fileUrl);
        }
      }

      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setMediaUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const headers = getHeaders();

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Latitude and Longitude must be valid numbers");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      summary,
      mediaUrls,
      latitude: lat,
      longitude: lng,
      observedAt: new Date(observedAt).toISOString(),
    };

    try {
      const res = await fetch(`/api/scout/missions/${missionId}/submission`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
        throw new Error(data.error || "Failed to submit mission");
      }

      const label = submission ? "Resubmitted" : "Submitted";
      alert(`Mission report ${label.toLowerCase()} successfully!`);
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
  const hasExistingSubmission = submission !== null;
  const hasRejectionReason = hasExistingSubmission && !!submission?.rejectionReason;

  const submitButtonLabel = (() => {
    if (isSubmitting) return "Submitting...";
    if (hasExistingSubmission) return "Resubmit Report";
    return "Submit Report";
  })();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isSubmitted ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
              }`}
            >
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

          {(isInProgress || isMatched || hasRejectionReason) && (
            <ScoutLivestreamBroadcaster
              missionId={missionId}
              onRecordingReady={(recordingUrl) => {
                setMediaUrls((prev) =>
                  prev.includes(recordingUrl) ? prev : [...prev, recordingUrl],
                );
              }}
            />
          )}

          {hasRejectionReason && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Submission was rejected.</strong> Please review the reason below, update your
              report, and resubmit.
              <div className="mt-2 rounded-md border border-red-100 bg-white p-3">
                <strong>Reason:</strong> {submission!.rejectionReason}
                {submission!.reviewedAt && (
                  <div className="mt-1 text-xs text-gray-500">
                    Reviewed at: {new Date(submission!.reviewedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {(isInProgress || hasRejectionReason) && (
            <div className="rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">
                {hasExistingSubmission ? "Resubmit Mission Report" : "Submit Mission Report"}
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

                <div className="space-y-3">
                  <Label>Evidence Photos & Videos (Ảnh & Video minh chứng)</Label>

                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="evidence-file-input"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isSubmitting || isUploading}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("evidence-file-input")?.click()}
                        disabled={isSubmitting || isUploading}
                      >
                        {isUploading ? "Uploading..." : "📷 / 🎥 Upload Image or Video"}
                      </Button>
                    </div>

                    {uploadError && (
                      <p className="text-xs font-medium text-red-600">{uploadError}</p>
                    )}

                    {mediaUrls.length > 0 ? (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {mediaUrls.map((url, idx) => {
                          const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
                          const fileName = url.split("/").pop() || `Evidence #${idx + 1}`;
                          return (
                            <div
                              key={`${url}-${idx}`}
                              className="relative flex items-center justify-between rounded-lg border border-[var(--scoutx-border)] bg-gray-50 p-2.5 text-xs"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-sm">{isVideo ? "🎥" : "🖼️"}</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="max-w-[180px] truncate font-medium text-blue-600 hover:underline"
                                >
                                  {fileName}
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(url)}
                                disabled={isSubmitting}
                                className="ml-2 text-sm font-bold text-red-500 hover:text-red-700"
                                title="Remove file"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[var(--scoutx-muted-foreground)]">
                        No evidence files attached yet. Click above to upload on-site photos or
                        videos.
                      </p>
                    )}
                  </div>
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

                <div className="space-y-2">
                  <Label htmlFor="observedAt">Observed At (date and time)</Label>
                  <Input
                    id="observedAt"
                    type="datetime-local"
                    required
                    value={observedAt}
                    onChange={(e) => setObservedAt(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {submitButtonLabel}
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
        </div>
      </div>
    </div>
  );
}
