import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";
import type { Mission } from "@scoutx/types";
import type { EventBus } from "@scoutx/events";
import { NotFoundError, ConflictError } from "./ApproveMissionSubmissionUseCase";

export interface ResubmitInput {
  summary: string;
  mediaUrls: string[];
  latitude: number;
  longitude: number;
  observedAt: string;
}

export class ResubmitMissionSubmissionUseCase {
  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    missionId: string,
    scoutId: string,
    userRole: string,
    input: ResubmitInput,
  ): Promise<void> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can resubmit mission submissions");
    }

    if (!input.summary || input.summary.trim().length < 10) {
      throw new Error("Summary must be at least 10 characters long");
    }

    if (
      isNaN(input.latitude) ||
      isNaN(input.longitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new Error(
        "Latitude must be between -90 and 90, and Longitude must be between -180 and 180",
      );
    }

    const observedAt = new Date(input.observedAt);
    if (isNaN(observedAt.getTime())) {
      throw new Error("Invalid observedAt: must be a valid ISO date string");
    }

    // Read mission to check existence and assignment
    const mission: Mission | null = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new NotFoundError("Mission not found");
    }

    const assigned = await this.missionRepo.findAssignedByScoutId(scoutId);
    const isAssigned = assigned.some((m) => m.id === missionId);
    if (!isAssigned) {
      throw new AuthorizationError("You are not assigned to this mission");
    }
    if (mission.status !== "IN_PROGRESS") {
      throw new ConflictError("Mission is not in IN_PROGRESS status; cannot resubmit");
    }

    const success = await this.missionRepo.resubmitSubmissionAtomically(missionId, scoutId, {
      summary: input.summary,
      mediaUrls: input.mediaUrls || [],
      latitude: input.latitude,
      longitude: input.longitude,
      observedAt: observedAt.toISOString(),
    });

    if (!success) {
      throw new ConflictError(
        "Failed to resubmit: concurrent modification detected (mission no longer in IN_PROGRESS or submission not found)",
      );
    }

    await this.eventBus.publish({
      type: "submission.resubmitted",
      missionId,
      scoutId,
      summary: input.summary,
      timestamp: new Date().toISOString(),
    });
  }
}
