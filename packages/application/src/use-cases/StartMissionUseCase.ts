import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class StartMissionUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(missionId: string, scoutId: string, userRole: string): Promise<Mission> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can start missions");
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

    if (mission.status === "IN_PROGRESS") {
      return mission;
    }

    if (mission.status !== "MATCHED") {
      throw new Error("Only matched missions can be started");
    }

    const success = await this.missionRepo.startAtomically(missionId, scoutId);
    if (!success) {
      throw new Error("Failed to start mission atomically");
    }

    const updated = await this.missionRepo.findById(missionId);
    if (!updated) {
      throw new Error("Mission not found after starting");
    }

    return updated;
  }
}
