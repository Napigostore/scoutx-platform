"use client";

import { useState, useEffect } from "react";
import { Button } from "@scoutx/ui";

interface MissionSettlementControlsProps {
  missionId: string;
  status: string;
  requesterId: string;
  assignedScoutId?: string | null;
  winnerId?: string | null;
  budgetCents: number;
  currency: string;
  completionRequestedAt?: string | null;
  settlementStartedAt?: string | null;
  rewardReleasedAt?: string | null;
  userContext?: {
    isRequester: boolean;
    isAssignedOrRecipient: boolean;
    hasSubmittedReport: boolean;
    canCompleteMission: boolean;
    canRequestReward: boolean;
    canDispute: boolean;
  } | null;
  participants?: { id: string; displayName: string; role: string }[];
  onRefresh?: () => void;
}

export function MissionSettlementControls({
  missionId,
  status,
  requesterId,
  winnerId,
  budgetCents,
  settlementStartedAt,
  userContext,
  participants = [],
  onRefresh,
}: MissionSettlementControlsProps) {
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [voteSide, setVoteSide] = useState<"REQUESTER_WIN" | "WORKER_WIN" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom hook for countdown could be used, or just standard state for simplicity:
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (status !== "COMPLETED_PENDING_SETTLEMENT" || !settlementStartedAt) return;

    const interval = setInterval(() => {
      const started = new Date(settlementStartedAt).getTime();
      const end = started + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Settlement ready...");
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, settlementStartedAt]);

  const budgetUSD = Math.round(budgetCents / 100);

  const handleCompleteAction = async (
    action: "REQUESTER_COMPLETE" | "WORKER_COMPLETE" | "ACCEPT" | "DISPUTE",
    payloadWinnerId?: string,
  ) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/missions/${missionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          winnerId: payloadWinnerId || selectedWinnerId,
          reason: disputeReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Action failed");
      }

      setMessage({ type: "success", text: "Action executed successfully!" });
      setShowWinnerModal(false);
      setShowDisputeModal(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to execute completion action";
      setMessage({ type: "error", text: errText });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReward = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/missions/${missionId}/reward-request`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to request reward");
      }
      setMessage({ type: "success", text: "Yêu cầu trả thưởng đã được gửi tới Requester!" });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to request reward";
      setMessage({ type: "error", text: errText });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeReason.trim()) {
      setMessage({ type: "error", text: "Please enter a dispute reason" });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/missions/${missionId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          reason: disputeReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit dispute");
      }

      setMessage({ type: "success", text: "Dispute submitted! Mission moved to DISPUTED state." });
      setShowDisputeModal(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Dispute submission failed";
      setMessage({ type: "error", text: errText });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (side: "REQUESTER_WIN" | "WORKER_WIN") => {
    setIsLoading(true);
    setMessage(null);
    try {
      // First get dispute ID
      const topRes = await fetch(`/api/disputes/top`);
      const topData = await topRes.json();
      const matchDispute = topData.disputes?.find(
        (d: { missionId: string }) => d.missionId === missionId,
      );

      if (!matchDispute) {
        throw new Error("No active public dispute found to vote on");
      }

      const voteRes = await fetch(`/api/disputes/${matchDispute.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: matchDispute.id, // Or active round ID
          selectedSide: side,
        }),
      });

      const voteData = await voteRes.json();
      if (!voteRes.ok || voteData.error) {
        throw new Error(voteData.error || "Vote failed");
      }

      setMessage({
        type: "success",
        text: voteData.message || "Vote recorded! +1 Coin reward awarded.",
      });
      setVoteSide(side);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Voting failed";
      setMessage({ type: "error", text: errText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Reward Pool: ${budgetUSD}
            </span>
            <span className="rounded-full bg-[var(--scoutx-muted)] px-2.5 py-0.5 text-xs font-bold uppercase text-[var(--scoutx-muted-foreground)]">
              Status: {status.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="font-display mt-2 text-lg font-bold text-[var(--scoutx-foreground)]">
            Mission Settlement & Governance Workflow
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* 1. Complete Mission / Trao phần thưởng - CHỈ Requester được thấy & bấm */}
          {userContext?.isRequester && (
            <Button
              onClick={() => setShowWinnerModal(true)}
              className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              🏆 Trao thưởng / Complete Mission
            </Button>
          )}

          {/* 2. Nút Complete Mission của Worker - CHỈ người nhận đã nộp submission/evidence mới thấy */}
          {!userContext?.isRequester && userContext?.hasSubmittedReport && (
            <Button
              variant="outline"
              onClick={() => handleCompleteAction("WORKER_COMPLETE")}
              disabled={isLoading}
              className="border-blue-500 font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              📩 Complete Mission (Báo hoàn thành)
            </Button>
          )}

          {/* 3. Nút Yêu cầu nhận thưởng - CHỈ hiện khi ĐÃ nộp submission/evidence */}
          {!userContext?.isRequester && userContext?.hasSubmittedReport && (
            <Button
              variant="outline"
              onClick={handleRequestReward}
              disabled={isLoading || !userContext.hasSubmittedReport}
              className={`font-semibold ${
                userContext.hasSubmittedReport
                  ? "border-emerald-500 text-emerald-600 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  : "cursor-not-allowed border-gray-300 text-gray-400 opacity-60"
              }`}
              title={
                userContext.hasSubmittedReport
                  ? "Bấm để gửi yêu cầu trả thưởng tới Requester"
                  : "Bạn cần gửi bằng chứng hoặc báo cáo trước khi yêu cầu trả thưởng"
              }
            >
              🎁 Yêu cầu trả thưởng
            </Button>
          )}

          {/* 4. Nút Claim phản đối (Dispute) - CHỈ người đã nhận nhiệm vụ hoặc người giao mới được claim phản đối */}
          {(userContext?.isRequester ||
            userContext?.isAssignedOrRecipient ||
            userContext?.hasSubmittedReport) && (
            <Button
              variant="secondary"
              onClick={() => setShowDisputeModal(true)}
              className="border border-amber-500/30 font-semibold text-amber-600 dark:text-amber-400"
            >
              ⚖️ Claim Outcome / Dispute
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-xs font-semibold ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
          }`}
        >
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      {/* Pending Requester Acceptance Alert & 48h Countdown */}
      {status === "PENDING_REQUESTER_ACCEPTANCE" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs dark:border-blue-800 dark:bg-blue-950/40">
          <p className="font-bold text-blue-900 dark:text-blue-200">
            ⏳ Completion requested by worker. Requester has 48h to ACCEPT or DISPUTE.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => handleCompleteAction("ACCEPT")}
              disabled={isLoading}
              className="bg-green-600 font-bold text-white hover:bg-green-700"
            >
              Accept Completion (+24h Release)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCompleteAction("DISPUTE")}
              disabled={isLoading}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Dispute Request
            </Button>
          </div>
        </div>
      )}

      {/* Completed Pending Settlement Countdown */}
      {status === "COMPLETED_PENDING_SETTLEMENT" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="font-bold text-emerald-900 dark:text-emerald-200">
            ✅ Mission Completed! Reward settlement countdown active.
          </p>
          <div className="mt-2 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {timeLeft || "Calculating..."}
          </div>
          {winnerId && (
            <p className="mt-2 text-[var(--scoutx-muted-foreground)]">
              Winner ID: <code className="rounded bg-emerald-100 px-1 py-0.5">{winnerId}</code>
            </p>
          )}
        </div>
      )}

      {/* Disputed / Community Voting UI */}
      {(status === "DISPUTED" || status === "COMMUNITY_VOTING") && (
        <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/50 p-5 text-xs dark:border-amber-700 dark:bg-amber-950/40">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              ⚖️ DISPUTE ACTIVE — COMMUNITY TRIAL
            </span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Min 50 Votes Required
            </span>
          </div>

          <p className="text-[var(--scoutx-foreground)]">
            Community members can review evidence, vote on the winner, and earn +1 Coin reward per
            vote.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="sm"
              onClick={() => handleVote("REQUESTER_WIN")}
              disabled={isLoading || voteSide === "REQUESTER_WIN"}
              className="bg-blue-600 font-bold text-white hover:bg-blue-700"
            >
              Vote: Requester Win (+1 Coin)
            </Button>

            <Button
              size="sm"
              onClick={() => handleVote("WORKER_WIN")}
              disabled={isLoading || voteSide === "WORKER_WIN"}
              className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              Vote: Worker Win (+1 Coin)
            </Button>
          </div>
        </div>
      )}

      {/* Select Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--scoutx-foreground)]">
              Select Mission Winner
            </h3>
            <p className="text-xs text-[var(--scoutx-muted-foreground)]">
              Select the winner from the valid mission participants.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search participant by name or ID..."
                value={selectedWinnerId}
                onChange={(e) => setSelectedWinnerId(e.target.value)}
                className="w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] px-3 py-2 text-sm text-[var(--scoutx-foreground)]"
              />
              <div className="bg-[var(--scoutx-muted)]/30 max-h-40 overflow-y-auto rounded-md border border-[var(--scoutx-border)]">
                {participants
                  .filter(
                    (p) =>
                      !selectedWinnerId ||
                      p.displayName?.toLowerCase().includes(selectedWinnerId.toLowerCase()) ||
                      p.id.toLowerCase().includes(selectedWinnerId.toLowerCase()),
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedWinnerId(p.id)}
                      className="cursor-pointer border-b border-[var(--scoutx-border)] px-3 py-2 text-sm last:border-0 hover:bg-[var(--scoutx-card)]"
                    >
                      <div className="font-bold text-[var(--scoutx-foreground)]">
                        {p.displayName}
                      </div>
                      <div className="text-xs text-[var(--scoutx-muted-foreground)]">
                        {p.id} • {p.role}
                      </div>
                    </div>
                  ))}
                {participants.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-[var(--scoutx-muted-foreground)]">
                    No active participants found.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowWinnerModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleCompleteAction("REQUESTER_COMPLETE", selectedWinnerId)}
                disabled={isLoading || !selectedWinnerId.trim()}
                className="bg-emerald-600 font-bold text-white"
              >
                Confirm Winner & Complete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--scoutx-foreground)]">
              Submit Outcome Dispute
            </h3>
            <p className="text-xs text-[var(--scoutx-muted-foreground)]">
              Provide an explanation for disputing this mission outcome. This will freeze reward
              release and open a Community Trial.
            </p>

            <textarea
              rows={4}
              placeholder="Describe your dispute grounds clearly..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] px-3 py-2 text-sm text-[var(--scoutx-foreground)]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowDisputeModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateDispute}
                disabled={isLoading || !disputeReason.trim()}
                className="bg-amber-600 font-bold text-white hover:bg-amber-700"
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
