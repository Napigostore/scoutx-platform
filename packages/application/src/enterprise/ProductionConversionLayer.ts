import type { EventQueue } from "../foundation/EventQueue";
import type { AnalyticsEngine } from "../foundation/AnalyticsEngine";

/* ─── Production Mission Lifecycle States ─── */

export type ProductionMissionState =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "ACTIVE"
  | "SCOUT_SELECTED"
  | "IN_PROGRESS"
  | "EVIDENCE_SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export interface LifecycleTransition {
  from: ProductionMissionState;
  to: ProductionMissionState;
  allowedRoles: string[];
}

export const VALID_TRANSITIONS: LifecycleTransition[] = [
  { from: "DRAFT", to: "PAYMENT_PENDING", allowedRoles: ["REQUESTER"] },
  { from: "PAYMENT_PENDING", to: "ACTIVE", allowedRoles: ["SYSTEM", "STRIPE_WEBHOOK"] },
  { from: "ACTIVE", to: "SCOUT_SELECTED", allowedRoles: ["REQUESTER", "SYSTEM"] },
  { from: "SCOUT_SELECTED", to: "IN_PROGRESS", allowedRoles: ["SCOUT"] },
  { from: "IN_PROGRESS", to: "EVIDENCE_SUBMITTED", allowedRoles: ["SCOUT"] },
  { from: "EVIDENCE_SUBMITTED", to: "UNDER_REVIEW", allowedRoles: ["SYSTEM"] },
  { from: "UNDER_REVIEW", to: "COMPLETED", allowedRoles: ["REQUESTER", "VERIFIER"] },
  { from: "ACTIVE", to: "CANCELLED", allowedRoles: ["REQUESTER", "ADMIN"] },
];

/* ─── Evidence Production Metadata ─── */

export interface ProductionEvidenceInput {
  evidenceId: string;
  missionId: string;
  scoutId: string;
  mediaUrl: string;
  mimeType: "image/jpeg" | "image/png" | "video/mp4" | "application/pdf";
  fileSizeBytes: number;
  location: { latitude: number; longitude: number; altitude?: number };
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/* ─── Notification & Analytics Business Events ─── */

export type ProductionBusinessEventType =
  | "user_signed_up"
  | "mission_created"
  | "checkout_started"
  | "payment_completed"
  | "scout_applied"
  | "scout_selected"
  | "mission_started"
  | "evidence_uploaded"
  | "mission_completed"
  | "review_created";

export class ProductionConversionService {
  constructor(
    private readonly eventQueue: EventQueue,
    private readonly analyticsEngine: AnalyticsEngine,
  ) {}

  public validateStateTransition(
    current: ProductionMissionState,
    next: ProductionMissionState,
    role: string,
  ): boolean {
    return VALID_TRANSITIONS.some(
      (t) => t.from === current && t.to === next && t.allowedRoles.includes(role),
    );
  }

  public recordBusinessEvent(
    eventType: ProductionBusinessEventType,
    userId: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.analyticsEngine.recordRequesterActivity(userId);
    this.eventQueue.enqueue("notification", {
      type: eventType,
      userId,
      metadata: metadata ?? {},
    });
  }

  public handlePaymentConfirmation(
    missionId: string,
    requesterId: string,
    amountCents: number,
  ): void {
    this.recordBusinessEvent("payment_completed", requesterId, { missionId, amountCents });
    this.eventQueue.enqueue("coin_update", {
      action: "payment_escrow_activated",
      missionId,
      amountCents,
    });
  }
}
