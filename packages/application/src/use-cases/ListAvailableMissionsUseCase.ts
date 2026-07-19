import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class ListAvailableMissionsUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(userRole: string): Promise<readonly Mission[]> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can discover available missions");
    }

    return this.missionRepo.findAvailable();
  }
}
