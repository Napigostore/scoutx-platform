import type { Mission, CreateMissionInput } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class CreateMissionUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(
    input: CreateMissionInput,
    requesterId: string,
    userRole: string,
  ): Promise<Mission> {
    if (userRole !== "REQUESTER") {
      throw new AuthorizationError("Only requesters can create missions");
    }

    const mission: Mission = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      category: input.category,
      status: "DRAFT",
      urgency: input.urgency || "NORMAL",
      budget: input.budget,
      locationId: input.locationId,
      coordinates: input.coordinates,
      radiusMeters: input.radiusMeters || 1500,
      requesterId,
      assignedScoutId: null,
      requiredTags: input.requiredTags || [],
      expiresAt: input.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.missionRepo.create(mission);
    return mission;
  }
}
