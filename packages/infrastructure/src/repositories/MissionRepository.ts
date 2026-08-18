import type { Mission } from "@scoutx/types";

export interface RejectSubmissionInput {
  rejectionReason: string;
}

export interface ResubmitSubmissionInput {
  summary: string;
  mediaUrls: string[];
  latitude: number;
  longitude: number;
  observedAt: string;
}

export interface MissionRepository {
  create(mission: Mission): Promise<void>;
  findById(id: string): Promise<Mission | null>;
  findByOwnerId(ownerId: string): Promise<readonly Mission[]>;
  update(mission: Mission): Promise<void>;
  findAvailable(scoutUserId?: string): Promise<readonly Mission[]>;
  claimAtomically(missionId: string, scoutId: string): Promise<boolean>;
  findAssignedByScoutId(scoutId: string): Promise<readonly Mission[]>;
  startAtomically(missionId: string, scoutId: string): Promise<boolean>;
  createSubmissionAtomically(
    missionId: string,
    scoutId: string,
    summary: string,
    mediaUrls: string[],
    latitude: number,
    longitude: number,
    failCreate?: boolean,
  ): Promise<unknown>;

  approveSubmissionAtomically(missionId: string, requesterId: string): Promise<boolean>;

  rejectSubmissionAtomically(
    missionId: string,
    requesterId: string,
    input: RejectSubmissionInput,
  ): Promise<boolean>;

  resubmitSubmissionAtomically(
    missionId: string,
    scoutId: string,
    input: ResubmitSubmissionInput,
  ): Promise<boolean>;
}
