import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class ListScoutAssignedMissionsUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(scoutId: string, userRole: string): Promise<readonly Mission[]> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can view assigned missions");
    }

    return this.missionRepo.findAssignedByScoutId(scoutId);
  }
}
