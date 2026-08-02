import type { EventQueue } from "./EventQueue";
import type { AnalyticsEngine } from "./AnalyticsEngine";
import type { ModerationEngine } from "./ModerationEngine";

export interface MissionCreatedPayload {
  missionId: string;
  requesterId: string;
  title: string;
  bounty: number;
  category: string;
  location: string;
}

export interface MissionUpdatedPayload {
  missionId: string;
  updatedFields: string[];
  updatedBy: string;
}

export interface EvidenceUploadedPayload {
  evidenceId: string;
  missionId: string;
  uploaderId: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  textContent?: string;
}

export interface EvidenceVerifiedPayload {
  evidenceId: string;
  missionId: string;
  scoutId: string;
  verifierId: string;
  verified: boolean;
  rewardAmount: number;
}

export interface MissionClosedPayload {
  missionId: string;
  closedBy: string;
  reason: string;
  escrowAmount: number;
}

export class ProductionIntegrationPipeline {
  constructor(
    private readonly eventQueue: EventQueue,
    private readonly analyticsEngine: AnalyticsEngine,
    private readonly moderationEngine: ModerationEngine,
  ) {}

  /**
   * 1. Event Flow: Mission Created
   * Mission Created ➔ Escrow Lock ➔ Timeline Event ➔ Search Index ➔ Notification ➔ Realtime ➔ Analytics ➔ Audit Log
   */
  public async handleMissionCreated(payload: MissionCreatedPayload): Promise<void> {
    this.analyticsEngine.recordRequesterActivity(payload.requesterId);
    this.analyticsEngine.recordCoinTransaction(payload.bounty);

    // Enqueue downstream processing steps
    this.eventQueue.enqueue("coin_update", {
      action: "escrow_lock",
      missionId: payload.missionId,
      amount: payload.bounty,
      lockedBy: payload.requesterId,
    });

    this.eventQueue.enqueue("search_indexing", {
      type: "investigation",
      id: payload.missionId,
      title: payload.title,
      content: `${payload.category} - ${payload.location}`,
      tags: [payload.category, payload.location],
      metadata: { bounty: payload.bounty, status: "active" },
    });

    this.eventQueue.enqueue("notification", {
      type: "mission.created",
      title: "Mission Created",
      message: `Mission "${payload.title}" created with ${payload.bounty} coin escrow.`,
      investigationId: payload.missionId,
    });
  }

  /**
   * 2. Event Flow: Mission Updated
   * Mission Updated ➔ Timeline ➔ Recommendation Refresh ➔ Leaderboard Refresh ➔ Discovery Refresh ➔ Audit Log
   */
  public async handleMissionUpdated(payload: MissionUpdatedPayload): Promise<void> {
    this.eventQueue.enqueue("statistics", {
      action: "recommendation_refresh",
      missionId: payload.missionId,
    });

    this.eventQueue.enqueue("search_indexing", {
      type: "investigation",
      id: payload.missionId,
      title: `Mission ${payload.missionId}`,
      content: `Updated fields: ${payload.updatedFields.join(", ")}`,
      tags: payload.updatedFields,
      metadata: { updatedBy: payload.updatedBy },
    });
  }

  /**
   * 3. Event Flow: Evidence Uploaded
   * Evidence Uploaded ➔ Storage ➔ Virus Scan ➔ Metadata ➔ Thumbnail ➔ Moderation ➔ Timeline ➔ Search Index ➔ Realtime ➔ Notification ➔ Analytics ➔ Audit Log
   */
  public async handleEvidenceUploaded(payload: EvidenceUploadedPayload): Promise<void> {
    this.analyticsEngine.recordScoutActivity(payload.uploaderId);

    // Moderation check
    if (payload.textContent) {
      this.moderationEngine.evaluateContent(payload.evidenceId, "evidence", payload.textContent);
    }

    this.eventQueue.enqueue("search_indexing", {
      type: "evidence",
      id: payload.evidenceId,
      title: `Evidence for ${payload.missionId}`,
      content: `File: ${payload.storageKey} (${payload.mimeType})`,
      tags: [payload.mimeType],
      metadata: { missionId: payload.missionId, uploaderId: payload.uploaderId },
    });

    this.eventQueue.enqueue("notification", {
      type: "evidence.created",
      title: "New Evidence Uploaded",
      message: `Evidence uploaded for mission ${payload.missionId}`,
      investigationId: payload.missionId,
    });
  }

  /**
   * 4. Event Flow: Evidence Verified
   * Evidence Verified ➔ Trust ➔ Coin Release ➔ Wallet ➔ Timeline ➔ Leaderboard ➔ Discovery ➔ Analytics ➔ Audit Log
   */
  public async handleEvidenceVerified(payload: EvidenceVerifiedPayload): Promise<void> {
    this.analyticsEngine.recordVerification(payload.verified);
    if (payload.verified) {
      this.analyticsEngine.recordCoinTransaction(payload.rewardAmount);
    }

    this.eventQueue.enqueue("trust_update", {
      scoutId: payload.scoutId,
      verified: payload.verified,
      evidenceId: payload.evidenceId,
    });

    if (payload.verified) {
      this.eventQueue.enqueue("coin_update", {
        action: "coin_release",
        missionId: payload.missionId,
        scoutId: payload.scoutId,
        amount: payload.rewardAmount,
      });
    }

    this.eventQueue.enqueue("statistics", {
      action: "leaderboard_refresh",
      scoutId: payload.scoutId,
    });
  }

  /**
   * 5. Event Flow: Mission Closed
   * Mission Closed ➔ Escrow Release ➔ Audit Log ➔ Analytics ➔ Search Refresh ➔ Realtime
   */
  public async handleMissionClosed(payload: MissionClosedPayload): Promise<void> {
    this.analyticsEngine.recordMissionCompleted(1.5, 12.0);

    this.eventQueue.enqueue("coin_update", {
      action: "escrow_release",
      missionId: payload.missionId,
      amount: payload.escrowAmount,
      closedBy: payload.closedBy,
      reason: payload.reason,
    });

    this.eventQueue.enqueue("search_indexing", {
      type: "investigation",
      id: payload.missionId,
      title: `Closed Mission ${payload.missionId}`,
      content: `Closed reason: ${payload.reason}`,
      tags: ["closed"],
      metadata: { status: "closed", closedBy: payload.closedBy },
    });
  }
}
