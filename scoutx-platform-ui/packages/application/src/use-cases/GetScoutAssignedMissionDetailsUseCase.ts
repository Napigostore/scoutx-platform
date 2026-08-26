import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class GetScoutAssignedMissionDetailsUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(missionId: string, scoutId: string, userRole: string): Promise<Mission> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can view assigned mission details");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    const assigned = await this.missionRepo.findAssignedByScoutId(scoutId);
    const isAssigned = assigned.some((m) => m.id === missionId);
    if (!isAssigned) {
      throw new AuthorizationError("You are not assigned to this mission");
    }

    return mission;
  }
}
