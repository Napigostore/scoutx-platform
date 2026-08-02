// Realtime investigation event types (frontend events)
export type InvestigationRealtimeEvent =
  | {
      type: "evidence.created";
      investigationId: string;
      item: {
        id: string;
        url?: string;
        photoUrl?: string;
        caption: string;
        capturedAt: string;
        capturedBy?: string;
        verified: boolean;
        mimeType?: string;
        type?: string;
      };
    }
  | {
      type: "evidence.updated";
      investigationId: string;
      item: {
        id: string;
        url?: string;
        photoUrl?: string;
        caption?: string;
        capturedAt?: string;
        capturedBy?: string;
        verified?: boolean;
        mimeType?: string;
        type?: string;
      };
    }
  | { type: "evidence.deleted"; investigationId: string; evidenceId: string }
  | {
      type: "evidence.upload.started";
      investigationId: string;
      evidenceId: string;
      filename: string;
    }
  | {
      type: "evidence.upload.completed";
      investigationId: string;
      evidenceId: string;
      photoUrl: string;
      storageKey: string;
      mimeType: string;
      fileSize: number;
    }
  | {
      type: "evidence.verified";
      investigationId: string;
      evidenceId: string;
      verified: boolean;
      verifiedBy: string;
      timestamp: string;
    }
  | {
      type: "timeline.created";
      investigationId: string;
      event: {
        id: string;
        type: "created" | "evidence" | "update" | "verify" | "note" | "scout_joined";
        summary: string;
        detail?: string;
        actor: string;
        timestamp: string;
      };
    }
  | {
      type: "mission.updated";
      investigationId: string;
      currentBounty: number;
      updatedFields: string[];
    }
  | { type: "trust.updated"; investigationId: string; trustScore: number; previousScore: number }
  | { type: "coin.updated"; investigationId: string; currentBounty?: number; amount?: number }
  | {
      type: "coin.released";
      investigationId: string;
      amount: number;
      reason: string;
      releasedBy: string;
      timestamp: string;
    };

export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "offline";

export type RealtimeEventHandler = (event: InvestigationRealtimeEvent) => void;

export interface RealtimeEventProviderState {
  status: ConnectionStatus;
  subscribe: (handler: RealtimeEventHandler) => () => void;
  subscribeType: (
    type: InvestigationRealtimeEvent["type"],
    handler: RealtimeEventHandler,
  ) => () => void;
}
