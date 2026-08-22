"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@scoutx/ui";

interface ScoutLivestreamBroadcasterProps {
  missionId: string;
  onRecordingReady?: (recordingUrl: string) => void;
}

export function ScoutLivestreamBroadcaster({
  missionId,
  onRecordingReady,
}: ScoutLivestreamBroadcasterProps) {
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const formatElapsed = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const stopLocalMediaAndConnection = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const handleStartStream = async () => {
    setError("");
    setPermissionDenied(false);
    setDebugInfo("");
    setIsStarting(true);

    const isSecureContext = typeof window !== "undefined" && window.isSecureContext;
    const protocol = typeof window !== "undefined" ? window.location.protocol : "unknown";

    if (!isSecureContext) {
      const secMsg = `Trình duyệt chặn truy cập Camera/Microphone do trang web chạy trên môi trường không an toàn (${protocol}). Yêu cầu HTTPS.`;
      setError(secMsg);
      setDebugInfo(`location.protocol: ${protocol}, isSecureContext: false`);
      setIsStarting(false);
      return;
    }

    try {
      // 1. Request camera and microphone access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (camErr: unknown) {
        const errName = camErr instanceof Error ? camErr.name : "UnknownError";
        const errMsg = camErr instanceof Error ? camErr.message : String(camErr);

        console.error("[CAMERA_PERMISSIONS_DEBUG]", {
          name: errName,
          message: errMsg,
          protocol,
          isSecureContext,
        });

        setDebugInfo(
          `ErrorName: ${errName} | Message: ${errMsg} | Protocol: ${protocol} | SecureContext: ${isSecureContext}`,
        );

        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          setPermissionDenied(true);
          throw new Error(
            "Quyền truy cập Camera & Microphone bị từ chối trên trình duyệt của bạn.",
          );
        } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
          throw new Error("Không tìm thấy Camera hoặc Microphone trên thiết bị của bạn.");
        } else if (errName === "NotReadableError" || errName === "TrackStartError") {
          throw new Error(
            "Camera hoặc Microphone đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.",
          );
        } else if (errName === "SecurityError") {
          throw new Error(
            "Trình duyệt từ chối truy cập do chính sách bảo mật (Security Policy / Headers).",
          );
        } else {
          throw new Error(`Không thể khởi tạo Camera/Microphone: ${errMsg}`);
        }
      }

      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Call backend stream/start API
      const res = await fetch(`/api/scout/missions/${missionId}/stream/start`, {
        method: "POST",
        headers: getHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize live stream server");
      }

      const { whipUrl } = data;
      if (!whipUrl) {
        throw new Error("No WebRTC WHIP ingest URL returned by server");
      }

      // 3. Initiate WebRTC WHIP connection directly with Cloudflare Stream Ingest
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const whipRes = await fetch(whipUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!whipRes.ok && whipRes.status !== 201) {
        throw new Error(`WHIP stream publish failed with status ${whipRes.status}`);
      }

      const answerSdp = await whipRes.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setIsLive(true);
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      stopLocalMediaAndConnection();
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopStream = async () => {
    setIsStopping(true);
    try {
      const res = await fetch(`/api/scout/missions/${missionId}/stream/stop`, {
        method: "POST",
        headers: getHeaders(),
      });

      const data = await res.json();
      if (data.recordingUrl && onRecordingReady) {
        onRecordingReady(data.recordingUrl);
      }
    } catch (err: unknown) {
      console.error("Error stopping stream on server:", err);
    } finally {
      stopLocalMediaAndConnection();
      setIsLive(false);
      setIsStopping(false);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopLocalMediaAndConnection();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--scoutx-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">
            Mission Livestream (Phát trực tiếp thực địa)
          </h3>
          <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
            Stream live WebRTC video directly to the requester from your browser camera.
          </p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-600" />
            <span>🔴 LIVE ({formatElapsed(elapsedSeconds)})</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <p className="font-semibold">{error}</p>

          {permissionDenied && (
            <div className="mt-3 rounded-md border border-red-300 bg-white p-3 text-gray-800">
              <p className="mb-1 font-bold text-red-600">
                🔒 Hướng dẫn mở lại Camera & Microphone:
              </p>
              <ol className="list-decimal space-y-1 pl-4 text-xs">
                <li>
                  Bấm vào biểu tượng <strong>Ổ khóa (Lock) 🔒</strong> hoặc{" "}
                  <strong>Cài đặt trang web</strong> bên trái thanh địa chỉ URL.
                </li>
                <li>
                  Tìm mục <strong>Camera</strong> và <strong>Microphone</strong>.
                </li>
                <li>
                  Đổi trạng thái từ <em>Chặn (Block)</em> sang <strong>Cho phép (Allow)</strong>.
                </li>
                <li>Tải lại trang (F5 / Refresh) và bấm nút &quot;Bắt đầu Livestream&quot; lại.</li>
              </ol>
            </div>
          )}

          {debugInfo && (
            <div className="mt-2 break-all font-mono text-[10px] text-gray-500">
              [Debug Info] {debugInfo}
            </div>
          )}
        </div>
      )}

      <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-black">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${isLive || isStarting ? "block" : "hidden"}`}
        />
        {!isLive && !isStarting && (
          <div className="p-6 text-center text-gray-400">
            <p className="mb-2 text-4xl">📹</p>
            <p className="text-sm font-medium">Camera is offline</p>
            <p className="mt-1 text-xs text-gray-500">
              Click &quot;Start Livestream&quot; below to begin broadcasting on-site evidence.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!isLive ? (
          <Button
            type="button"
            onClick={handleStartStream}
            disabled={isStarting}
            className="w-full bg-red-600 text-white hover:bg-red-700"
          >
            {isStarting ? "Initializing Camera & Stream..." : "🔴 Bắt đầu Livestream"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleStopStream}
            disabled={isStopping}
            className="w-full border-red-600 text-red-600 hover:bg-red-50"
          >
            {isStopping ? "Stopping Stream..." : "⬛ Dừng Livestream"}
          </Button>
        )}
      </div>
    </div>
  );
}
