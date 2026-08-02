import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";
import type { Mission } from "@scoutx/types";
import type { EventBus } from "@scoutx/events";

export class ApproveMissionSubmissionUseCase {
  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(missionId: string, requesterId: string, userRole: string): Promise<void> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can approve mission submissions");
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

    const success = await this.missionRepo.approveSubmissionAtomically(missionId, requesterId);

    if (!success) {
      throw new ConflictError(
        "Failed to approve submission: concurrent modification detected (mission no longer in SUBMITTED status or ownership mismatch)",
      );
    }

    await this.eventBus.publish({
      type: "mission.approved",
      missionId,
      requesterId,
      scoutId: mission.assignedScoutId ?? "",
      rewardAmount: {
        amountMinor: mission.budget.amountCents,
        currency: mission.budget.currency,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
