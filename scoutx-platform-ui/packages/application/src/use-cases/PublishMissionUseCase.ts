import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class PublishMissionUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(missionId: string, requesterId: string, userRole: string): Promise<Mission> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can publish missions");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    if (mission.requesterId !== requesterId) {
      throw new AuthorizationError("You do not own this mission");
    }

    if (mission.status === "OPEN") {
      // Idempotent success
      return mission;
    }

    if (mission.status !== "DRAFT") {
      throw new Error("Only draft missions can be published");
    }

    const updatedMission: Mission = {
      ...mission,
      status: "OPEN",
      updatedAt: new Date(),
    };

    await this.missionRepo.update(updatedMission);
    return updatedMission;
  }
}
