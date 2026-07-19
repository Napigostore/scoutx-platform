import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class ListRequesterMissionsUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(requesterId: string, userRole: string): Promise<readonly Mission[]> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can list their missions");
    }

    return this.missionRepo.findByOwnerId(requesterId);
  }
}
