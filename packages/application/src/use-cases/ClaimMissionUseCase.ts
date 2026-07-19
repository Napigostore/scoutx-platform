import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class ClaimMissionUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(missionId: string, scoutId: string, userRole: string): Promise<Mission> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can claim missions");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    if (mission.status !== "OPEN") {
      throw new Error("Mission is not available for claiming");
    }

    if (mission.expiresAt < new Date()) {
      throw new Error("Mission has expired");
    }

    const success = await this.missionRepo.claimAtomically(missionId, scoutId);
    if (!success) {
      throw new Error("Mission was already claimed by another scout");
    }

    const updated = await this.missionRepo.findById(missionId);
    if (!updated) {
      throw new Error("Mission not found after claiming");
    }

    return updated;
  }
}
