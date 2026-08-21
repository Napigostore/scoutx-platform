export interface CreateLiveInputOptions {
  readonly missionId: string;
  readonly scoutId: string;
}

export interface StreamLiveInputResult {
  readonly liveInputId: string;
  readonly whipUrl: string;
  readonly whepUrl: string;
  readonly hlsPlaybackUrl: string;
}

export interface StreamStatusResult {
  readonly liveInputId: string;
  readonly status: "OFFLINE" | "STARTING" | "LIVE" | "STOPPING" | "ENDED";
  readonly activeVideoId?: string;
  readonly recordingVideoId?: string;
  readonly recordingStatus?: "PROCESSING" | "READY";
  readonly recordingUrl?: string;
}

export interface StreamProvider {
  createLiveInput(options: CreateLiveInputOptions): Promise<StreamLiveInputResult>;
  getLiveStatus(liveInputId: string): Promise<StreamStatusResult>;
  getRecording(liveInputId: string, videoId?: string): Promise<{ url: string; ready: boolean }>;
  endLiveInput(liveInputId: string): Promise<void>;
}
