import type { Money } from "@scoutx/domain";

export interface MissionApprovedEvent {
  type: "mission.approved";
  missionId: string;
  requesterId: string;
  scoutId: string;
  rewardAmount: Money;
  timestamp: string;
}

export interface MissionRejectedEvent {
  type: "mission.rejected";
  missionId: string;
  requesterId: string;
  scoutId: string;
  rejectionReason: string;
  timestamp: string;
}

export interface MissionCancelledEvent {
  type: "mission.cancelled";
  missionId: string;
  requesterId: string;
  refundAmount: Money;
  timestamp: string;
}

export interface SubmissionResubmittedEvent {
  type: "submission.resubmitted";
  missionId: string;
  scoutId: string;
  summary: string;
  timestamp: string;
}

export type MissionDomainEvent =
  MissionApprovedEvent | MissionRejectedEvent | MissionCancelledEvent | SubmissionResubmittedEvent;
