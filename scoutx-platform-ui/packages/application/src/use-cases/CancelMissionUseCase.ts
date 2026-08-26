import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";
import type { EventBus } from "@scoutx/events";

export class CancelMissionUseCase {
  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(missionId: string, requesterId: string, userRole: string): Promise<Mission> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can cancel missions");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    if (mission.requesterId !== requesterId) {
      throw new AuthorizationError("You do not own this mission");
    }

    // Only DRAFT or OPEN missions can be cancelled
    if (mission.status !== "DRAFT" && mission.status !== "OPEN") {
      throw new Error("Only draft or open missions can be cancelled");
    }

    const updatedMission: Mission = {
      ...mission,
      status: "CANCELLED",
      updatedAt: new Date(),
    };

    await this.missionRepo.update(updatedMission);

    await this.eventBus.publish({
      type: "mission.cancelled",
      missionId,
      requesterId,
      refundAmount: {
        amountMinor: mission.budget.amountCents,
        currency: mission.budget.currency,
      },
      timestamp: new Date().toISOString(),
    });

    return updatedMission;
  }
}
