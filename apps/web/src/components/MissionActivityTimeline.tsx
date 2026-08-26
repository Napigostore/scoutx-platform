"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@scoutx/ui";

export interface TimelineActor {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
}

export interface TimelineEventItem {
  id: string;
  eventType: string;
  summary: string;
  mediaUrl?: string | null;
  type?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor: TimelineActor;
}

interface MissionActivityTimelineProps {
  missionId: string;
  currentRole?: "REQUESTER" | "SCOUT" | "ADMIN";
}

export function MissionActivityTimeline({
  missionId,
  currentRole = "SCOUT",
}: MissionActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`/api/missions/${missionId}/timeline`, {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err: unknown) {
      console.error("Error fetching timeline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const handleSendMessage = async (type: "MESSAGE" | "EVIDENCE_REQUEST" = "MESSAGE") => {
    if (!message.trim()) return;

    setIsSending(true);
    setError("");

    try {
      const res = await fetch(`/api/missions/${missionId}/activity`, {
        method: "POST",
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post activity");
      }

      setMessage("");
      fetchTimeline();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("missionId", missionId);

        const res = await fetch("/api/evidence/upload", {
          method: "POST",
          headers: getHeaders(),
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
      }

      fetchTimeline();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getEventBadge = (ev: TimelineEventItem) => {
    const meta = ev.metadata as Record<string, unknown> | null;
    const isOriginal = meta?.category === "ORIGINAL_REQUEST";

    if (ev.eventType === "EVIDENCE_UPLOADED") {
      if (isOriginal) {
        return {
          icon: "📌",
          bg: "bg-purple-100 text-purple-800 border-purple-300",
          label: "ORIGINAL REQUEST",
        };
      }
      if (ev.actor.role === "REQUESTER") {
        return {
          icon: "🖼️",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "REQUESTER MEDIA",
        };
      }
      return {
        icon: "📷",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "SCOUT EVIDENCE",
      };
    }

    if (ev.eventType === "EVIDENCE_REQUESTED") {
      return {
        icon: "⚠️",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "EVIDENCE REQUEST",
      };
    }

    if (ev.eventType === "MESSAGE_SENT") {
      if (ev.actor.role === "REQUESTER") {
        return {
          icon: "💬",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "REQUESTER MESSAGE",
        };
      }
      return { icon: "💬", bg: "bg-blue-50 text-blue-700 border-blue-200", label: "SCOUT MESSAGE" };
    }

    if (ev.eventType === "MISSION_CREATED") {
      return {
        icon: "🚀",
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        label: "SYSTEM EVENT",
      };
    }

    return { icon: "📌", bg: "bg-gray-100 text-gray-700 border-gray-200", label: "SYSTEM EVENT" };
  };

  return (
    <div className="rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[var(--scoutx-border)] pb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">
            Mission Activity & Evidence Timeline
          </h3>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Lịch sử tiến trình, tin nhắn & bằng chứng thực địa theo thời gian thực
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTimeline}
          className="rounded-lg border border-[var(--scoutx-border)] bg-gray-50 px-3 py-1.5 text-xs font-medium text-[var(--scoutx-foreground)] hover:bg-gray-100"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Timeline Event Feed */}
      <div className="relative mb-6 min-h-[160px] space-y-6 before:absolute before:bottom-0 before:left-4 before:top-2 before:w-0.5 before:bg-gray-200">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[var(--scoutx-muted-foreground)]">
            Đang tải timeline...
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-[var(--scoutx-muted-foreground)]">
            Chưa có hoạt động nào. Hãy nhập tin nhắn hoặc upload ảnh/video bên dưới.
          </div>
        ) : (
          events.map((ev) => {
            const badge = getEventBadge(ev);
            const isRequester = ev.actor.role === "REQUESTER";
            const isScout = ev.actor.role === "SCOUT";

            return (
              <div key={ev.id} className="relative flex gap-4 pl-8">
                {/* Timeline Dot */}
                <span className="absolute left-1.5 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-sm ring-2 ring-gray-200">
                  {badge.icon}
                </span>

                <div className="flex-1 rounded-xl border border-[var(--scoutx-border)] bg-gray-50/50 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--scoutx-foreground)] sm:text-sm">
                        {ev.actor.displayName}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          isRequester
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : isScout
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ev.actor.role}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <span className="text-[11px] text-[var(--scoutx-muted-foreground)]">
                      {new Date(ev.createdAt).toLocaleString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Summary / Message Text */}
                  <p className="whitespace-pre-wrap text-xs text-[var(--scoutx-foreground)] sm:text-sm">
                    {ev.summary}
                  </p>

                  {/* Attached Media (If Evidence) */}
                  {ev.mediaUrl && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-[var(--scoutx-border)] bg-black/5">
                      {ev.type === "VIDEO" || ev.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video
                          controls
                          src={ev.mediaUrl}
                          className="max-h-64 w-full object-contain"
                        />
                      ) : (
                        <a
                          href={ev.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-center"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ev.mediaUrl}
                            alt="Evidence"
                            className="max-h-64 w-full object-contain hover:opacity-95"
                          />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Bottom Action Bar */}
      <div className="border-t border-[var(--scoutx-border)] pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-[var(--scoutx-foreground)]">
            Gửi phản hồi / Thêm bằng chứng mới
          </label>

          {currentRole === "REQUESTER" && (
            <button
              type="button"
              disabled={isSending}
              onClick={() => handleSendMessage("EVIDENCE_REQUEST")}
              className="text-xs font-medium text-amber-700 hover:underline"
            >
              ⚠️ Yêu cầu bổ sung bằng chứng
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage("MESSAGE");
              }
            }}
            placeholder="Nhập tin nhắn hoặc yêu cầu thực địa..."
            className="flex-1 rounded-xl border border-[var(--scoutx-border)] px-4 py-2.5 text-xs text-[var(--scoutx-foreground)] focus:border-blue-500 focus:outline-none sm:text-sm"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? "Uploading..." : "📷 Attach Photo/Video"}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isSending || !message.trim()}
              onClick={() => handleSendMessage("MESSAGE")}
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
