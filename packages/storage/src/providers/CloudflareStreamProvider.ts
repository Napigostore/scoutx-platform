import type {
  CreateLiveInputOptions,
  StreamLiveInputResult,
  StreamProvider,
  StreamStatusResult,
} from "../contracts/StreamProvider";

export interface CloudflareStreamConfig {
  readonly accountId: string;
  readonly apiToken: string;
}

export class CloudflareStreamProvider implements StreamProvider {
  private readonly accountId: string;
  private readonly apiToken: string;

  constructor(config: CloudflareStreamConfig) {
    if (!config.accountId || !config.apiToken) {
      throw new Error("CloudflareStreamProvider requires accountId and apiToken");
    }
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  async createLiveInput(options: CreateLiveInputOptions): Promise<StreamLiveInputResult> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/live_inputs`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        meta: {
          name: `mission-${options.missionId}`,
          scoutId: options.scoutId,
        },
        recording: {
          mode: "automatic",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      const errorMsg = data.errors?.[0]?.message || "Failed to create Cloudflare Stream live input";
      throw new Error(`Cloudflare Stream Error: ${errorMsg}`);
    }

    const res = data.result;
    const whipUrl = res.webRTC?.url || `https://rtc.live.cloudflare.com/v1/whip/live/${res.uid}`;
    const whepUrl =
      res.webRTCPlayback?.url || `https://rtc.live.cloudflare.com/v1/whep/live/${res.uid}`;
    const hlsPlaybackUrl = res.playback?.hls || "";

    return {
      liveInputId: res.uid,
      whipUrl,
      whepUrl,
      hlsPlaybackUrl,
    };
  }

  async getLiveStatus(liveInputId: string): Promise<StreamStatusResult> {
    const inputUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/live_inputs/${liveInputId}`;
    const inputRes = await fetch(inputUrl, {
      headers: this.headers,
    });

    if (!inputRes.ok) {
      return {
        liveInputId,
        status: "OFFLINE",
      };
    }

    const inputData = await inputRes.json();
    const result = inputData.result;
    const isConnected = result?.status === "connected";

    // Check for recordings
    const recordingInfo = await this.getRecording(liveInputId);

    return {
      liveInputId,
      status: isConnected ? "LIVE" : recordingInfo.ready ? "ENDED" : "OFFLINE",
      recordingStatus: recordingInfo.ready ? "READY" : recordingInfo.url ? "PROCESSING" : undefined,
      recordingUrl: recordingInfo.url || undefined,
    };
  }

  async getRecording(
    liveInputId: string,
    videoId?: string,
  ): Promise<{ url: string; ready: boolean }> {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/live_inputs/${liveInputId}/videos`;
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return { url: "", ready: false };

      const data = await res.json();
      const videos = data.result || [];
      if (videos.length === 0) return { url: "", ready: false };

      const target = videoId ? videos.find((v: { uid: string }) => v.uid === videoId) : videos[0];
      if (!target) return { url: "", ready: false };

      const isReady = target.readyToStream === true || target.status?.state === "ready";
      const hlsUrl =
        target.playback?.hls ||
        `https://customer-${this.accountId}.cloudflarestream.com/${target.uid}/manifest/video.m3u8`;

      return {
        url: hlsUrl,
        ready: isReady,
      };
    } catch {
      return { url: "", ready: false };
    }
  }

  async endLiveInput(liveInputId: string): Promise<void> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/live_inputs/${liveInputId}`;
    await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    });
  }
}
