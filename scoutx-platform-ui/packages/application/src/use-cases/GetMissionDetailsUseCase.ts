import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class GetMissionDetailsUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(missionId: string, requesterId: string, userRole: string): Promise<Mission> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can view mission details");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    if (mission.requesterId !== requesterId) {
      throw new AuthorizationError("You do not own this mission");
    }

    return mission;
  }
}
