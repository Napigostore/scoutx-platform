"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@scoutx/ui";

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
  const [mediaUrls, setMediaUrls] = useState(
    "https://example.com/evidence1.jpg, https://example.com/evidence2.jpg",
  );
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 16));

  const getToken = () => localStorage.getItem("accessToken");

  const fetchData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Fetch mission assignment
      const missionRes = await fetch(`/api/scout/missions/${missionId}/assignment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const missionData = await missionRes.json();
      if (!missionRes.ok) throw new Error(missionData.error || "Failed to fetch mission details");
      setMission(missionData);
      setLatitude((missionData.coordinates?.latitude ?? "").toString());
      setLongitude((missionData.coordinates?.longitude ?? "").toString());

      // Fetch submission data
      const subRes = await fetch(`/api/missions/${missionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.submission) {
          setSubmission(subData.submission);
          setSummary(subData.submission.summary || "");
          setMediaUrls((subData.submission.mediaUrls || []).join(", "));
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
    const token = getToken();
    if (!token) {
      router.push("/sign-in");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      observedAt: new Date(observedAt).toISOString(),
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
        </div>
      </div>
    </div>
  );
}
