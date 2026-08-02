import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";
import type { Mission } from "@scoutx/types";
import type { EventBus } from "@scoutx/events";
import { NotFoundError, ConflictError } from "./ApproveMissionSubmissionUseCase";

export interface RejectSubmissionInput {
  rejectionReason: string;
}

export class RejectMissionSubmissionUseCase {
  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    missionId: string,
    requesterId: string,
    userRole: string,
    input: RejectSubmissionInput,
  ): Promise<void> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can reject mission submissions");
    }

    const reason = (input.rejectionReason || "").trim();
    if (!reason) {
      throw new Error("Rejection reason is required and must not be empty");
    }

    if (reason.length < 5) {
      throw new Error("Rejection reason must be at least 5 characters long");
    }

    const mission: Mission | null = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new NotFoundError("Mission not found");
    }
    if (mission.requesterId !== requesterId) {
      throw new AuthorizationError("You do not own this mission");
    }
    if (mission.status !== "SUBMITTED") {
      throw new ConflictError("Mission is not in SUBMITTED status");
    }

    const success = await this.missionRepo.rejectSubmissionAtomically(missionId, requesterId, {
      rejectionReason: reason,
    });

    if (!success) {
      throw new ConflictError(
        "Failed to reject submission: concurrent modification detected (mission no longer in SUBMITTED status or ownership mismatch)",
      );
    }

    await this.eventBus.publish({
      type: "mission.rejected",
      missionId,
      requesterId,
      scoutId: mission.assignedScoutId ?? "",
      rejectionReason: reason,
      timestamp: new Date().toISOString(),
    });
  }
}

export { NotFoundError, ConflictError };
