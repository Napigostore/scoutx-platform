"use client";

import { useState, useEffect, useRef } from "react";

interface RequesterLivestreamViewerProps {
  missionId: string;
}

export function RequesterLivestreamViewer({ missionId }: RequesterLivestreamViewerProps) {
  const [streamStatus, setStreamStatus] = useState<"OFFLINE" | "LIVE" | "ENDED">("OFFLINE");
  const [whepUrl, setWhepUrl] = useState("");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchStreamInfo = async () => {
    try {
      const res = await fetch(`/api/scout/missions/${missionId}/stream`, {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      setStreamStatus(data.streamStatus || "OFFLINE");
      setRecordingUrl(data.recordingUrl || null);

      if (data.streamStatus === "LIVE" && data.whepUrl && data.whepUrl !== whepUrl) {
        setWhepUrl(data.whepUrl);
      }
    } catch (err: unknown) {
      console.error("Error fetching stream info:", err);
    }
  };

  // Poll stream status every 5 seconds
  useEffect(() => {
    fetchStreamInfo();
    const interval = setInterval(fetchStreamInfo, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  // Connect WebRTC WHEP player when whepUrl changes and status is LIVE
  useEffect(() => {
    if (streamStatus !== "LIVE" || !whepUrl) return;

    let isCancelled = false;

    const connectWhep = async () => {
      try {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
        });
        peerConnectionRef.current = pc;

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
          if (!isCancelled && remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const whepRes = await fetch(whepUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        });

        if (!whepRes.ok && whepRes.status !== 201) {
          throw new Error(`WHEP connection failed with status ${whepRes.status}`);
        }

        const answerSdp = await whepRes.text();
        if (!isCancelled) {
          await pc.setRemoteDescription({
            type: "answer",
            sdp: answerSdp,
          });
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    connectWhep();

    return () => {
      isCancelled = true;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [streamStatus, whepUrl]);

  if (streamStatus === "OFFLINE" && !recordingUrl) {
    return (
      <div className="rounded-2xl border border-[var(--scoutx-border)] bg-gray-50 p-6 text-center text-sm text-[var(--scoutx-muted-foreground)]">
        <p className="mb-1 text-2xl">📹</p>
        <p className="font-medium text-[var(--scoutx-foreground)]">No active livestream</p>
        <p className="mt-1 text-xs">
          When the assigned Scout starts a live video stream, it will display here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[var(--scoutx-foreground)]">
            Live Stream & Evidence Video
          </span>
          {streamStatus === "LIVE" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
              <span className="h-2 w-2 animate-ping rounded-full bg-red-600" />
              🔴 LIVE NOW
            </span>
          )}
          {streamStatus === "ENDED" && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              STREAM RECORDED
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-black">
        {streamStatus === "LIVE" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            controls
            className="h-full w-full object-cover"
          />
        )}

        {streamStatus === "ENDED" && recordingUrl && (
          <video controls src={recordingUrl} className="h-full w-full object-cover" />
        )}

        {streamStatus === "ENDED" && !recordingUrl && (
          <div className="p-6 text-center text-gray-400">
            <p className="mb-1 text-3xl">⏳</p>
            <p className="text-sm font-medium">Recording Processing...</p>
            <p className="mt-1 text-xs text-gray-500">
              The livestream recording is being generated and will appear here shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
