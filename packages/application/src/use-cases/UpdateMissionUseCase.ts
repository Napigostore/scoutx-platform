import type { Mission, CreateMissionInput } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class UpdateMissionUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(
    missionId: string,
    input: Partial<CreateMissionInput>,
    requesterId: string,
    userRole: string,
  ): Promise<Mission> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can update missions");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    if (mission.requesterId !== requesterId) {
      throw new AuthorizationError("You do not own this mission");
    }

    if (mission.status !== "DRAFT") {
      throw new Error("Only draft missions can be updated");
    }

    const updatedMission: Mission = {
      ...mission,
      title: input.title !== undefined ? input.title : mission.title,
      description: input.description !== undefined ? input.description : mission.description,
      category: input.category !== undefined ? input.category : mission.category,
      urgency: input.urgency !== undefined ? input.urgency : mission.urgency,
      budget: input.budget !== undefined ? input.budget : mission.budget,
      locationId: input.locationId !== undefined ? input.locationId : mission.locationId,
      coordinates: input.coordinates !== undefined ? input.coordinates : mission.coordinates,
      radiusMeters: input.radiusMeters !== undefined ? input.radiusMeters : mission.radiusMeters,
      requiredTags: input.requiredTags !== undefined ? input.requiredTags : mission.requiredTags,
      expiresAt: input.expiresAt !== undefined ? input.expiresAt : mission.expiresAt,
      updatedAt: new Date(),
    };

    await this.missionRepo.update(updatedMission);
    return updatedMission;
  }
}
