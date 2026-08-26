"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { formatCurrency } from "@scoutx/application";
import { RequesterLivestreamViewer } from "@/components/RequesterLivestreamViewer";
import { MissionActivityTimeline } from "@/components/MissionActivityTimeline";
import { MissionSettlementControls } from "@/components/mission-settlement-controls";

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
  requesterId?: string;
  assignedScoutId?: string | null;
  budgetCents?: number;
  currency?: string;
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
  participantCount?: number;
  participants?: { id: string; displayName: string; role: string }[];
  referenceAttachments?: Array<{
    url: string;
    fileName: string;
    mimeType: string;
    createdAt: string;
  }>;
  userContext?: {
    isRequester: boolean;
    isAssignedOrRecipient: boolean;
    hasSubmittedReport: boolean;
    canCompleteMission: boolean;
    canRequestReward: boolean;
    canDispute: boolean;
  } | null;
}

export default function MissionDetailsPage({ params }: { params: Promise<{ missionId: string }> }) {
  const router = useRouter();
  const { missionId } = use(params);
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchMission();

    const handleRefresh = () => {
      fetchMission();
    };
    window.addEventListener("refresh-mission", handleRefresh);
    return () => {
      window.removeEventListener("refresh-mission", handleRefresh);
    };
  }, [missionId]);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchMission = async () => {
    try {
      const res = await fetch(`/api/missions/${missionId}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            `Authentication required (HTTP 401): ${data.error || "Session not found"}. Please sign in to view mission details.`,
          );
        }
        throw new Error(data.error || "Failed to fetch mission details");
      }
      setMission(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this mission?")) {
      return;
    }

    setIsCancelling(true);

    try {
      const res = await fetch(`/api/missions/${missionId}/cancel`, {
        method: "POST",
        headers: getAuthHeaders(),
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

    try {
      const res = await fetch(`/api/missions/${missionId}/publish`, {
        method: "POST",
        headers: getAuthHeaders(),
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

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/submission/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve submission");
      setMission(data);
      alert("Submission approved! Mission is now VERIFIED.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/submission/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject submission");
      setMission(data);
      setShowRejectForm(false);
      setRejectionReason("");
      alert("Submission rejected. The scout can now resubmit.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRejecting(false);
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
  const isCancellable =
    mission.status === "DRAFT" || mission.status === "OPEN" || mission.status === "PUBLISHED";
  const isSubmitted = mission.status === "SUBMITTED";
  const isReviewed = mission.status === "VERIFIED" || mission.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                mission.status === "SUBMITTED"
                  ? "bg-yellow-50 text-yellow-700"
                  : mission.status === "VERIFIED"
                    ? "bg-green-50 text-green-700"
                    : mission.status === "COMPLETED"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-green-50 text-green-700"
              }`}
            >
              {mission.status}
            </span>
            <span className="text-sm text-[var(--scoutx-muted-foreground)]">
              Category: {mission.category}
            </span>
            {mission.participantCount !== undefined && mission.participantCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                👥 {mission.participantCount} người đang tham gia
              </span>
            )}
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

          {mission.referenceAttachments && mission.referenceAttachments.length > 0 && (
            <div className="bg-[var(--scoutx-muted)]/50 rounded-2xl border border-[var(--scoutx-border)] p-5">
              <h3 className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                📷 Reference photos & videos
              </h3>
              <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
                Media uploaded during mission creation to clarify scope & requirements.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {mission.referenceAttachments.map((att, idx) => {
                  const isVideo =
                    att.mimeType?.startsWith("video/") || att.fileName.match(/\.(mp4|webm|mov)$/i);

                  return (
                    <div
                      key={att.url || idx}
                      className="overflow-hidden rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-2 shadow-sm"
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
                      <p className="mt-2 truncate text-center text-[11px] font-medium text-[var(--scoutx-foreground)]">
                        {att.fileName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <MissionSettlementControls
            missionId={missionId}
            status={mission.status}
            requesterId={mission.requesterId || ""}
            assignedScoutId={mission.assignedScoutId}
            budgetCents={mission.budgetCents || mission.budget?.amountCents || 1000}
            currency={mission.currency || mission.budget?.currency || "VND"}
            userContext={mission.userContext}
            participants={mission.participants}
            onRefresh={fetchMission}
          />

          <RequesterLivestreamViewer missionId={missionId} />

          <MissionActivityTimeline missionId={missionId} currentRole="REQUESTER" />

          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6">
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
            <div className="space-y-4 rounded-2xl border border-yellow-200 bg-yellow-50/30 p-6 dark:border-amber-800/60 dark:bg-amber-950/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-amber-200">
                  Submission Report
                  {mission.submission.verified && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/60 dark:text-green-300">
                      Verified
                    </span>
                  )}
                  {mission.submission.reviewedAt && !mission.submission.verified && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
                      Rejected
                    </span>
                  )}
                </h3>
              </div>

              {mission.submission.rejectionReason && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                  <strong>Rejection Reason:</strong> {mission.submission.rejectionReason}
                </div>
              )}

              {mission.submission.reviewedAt && (
                <div className="text-xs text-[var(--scoutx-muted-foreground)]">
                  Reviewed at: {new Date(mission.submission.reviewedAt).toLocaleString()}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-yellow-800 dark:text-amber-300">
                    Summary / Findings:
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-[var(--scoutx-foreground)]">
                    {mission.submission.summary}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-yellow-800 dark:text-amber-300">
                    Observed Coordinates:
                  </span>
                  <p className="mt-1 text-[var(--scoutx-foreground)]">
                    {mission.submission.latitude.toFixed(6)},{" "}
                    {mission.submission.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-yellow-800 dark:text-amber-300">
                    Observed At:
                  </span>
                  <p className="mt-1 text-[var(--scoutx-foreground)]">
                    {new Date(mission.submission.observedAt).toLocaleString()}
                  </p>
                </div>
                {mission.submission.mediaUrls.length > 0 && (
                  <div>
                    <span className="font-semibold text-yellow-800 dark:text-amber-300">
                      Evidence Images:
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {mission.submission.mediaUrls.map((url, idx) => (
                        <div key={idx}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={"Evidence " + (idx + 1)}
                            className="max-h-48 rounded-lg border border-yellow-100 object-cover dark:border-amber-800/50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isSubmitted && !isReviewed && mission.userContext?.isRequester && (
                <div className="mt-6 space-y-4 border-t border-yellow-200 pt-4 dark:border-amber-800/60">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isApproving ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      disabled={isRejecting}
                    >
                      Reject
                    </Button>
                  </div>

                  {showRejectForm && (
                    <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/60">
                      <label className="block text-sm font-medium text-red-800 dark:text-red-300">
                        Rejection Reason
                      </label>
                      <textarea
                        className="flex w-full rounded-md border border-red-300 bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] placeholder-[var(--scoutx-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        placeholder="Explain why the submission is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        disabled={isRejecting}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleReject}
                          disabled={isRejecting || !rejectionReason.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isRejecting ? "Rejecting..." : "Confirm Reject"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
              Budget
            </span>
            <p className="mt-1 text-3xl font-bold text-[var(--scoutx-foreground)]">
              {formatCurrency(mission.budget.amountCents, mission.budget.currency)}
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
                    className="inline-flex items-center rounded-md bg-[var(--scoutx-muted)] px-2 py-1 text-xs font-medium text-[var(--scoutx-muted-foreground)]"
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
