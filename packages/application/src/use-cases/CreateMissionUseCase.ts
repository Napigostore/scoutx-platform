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
    if (userRole !== "REQUESTER" && userRole !== "ADMIN") {
      throw new AuthorizationError("Only requesters or admins can create missions");
    }

    const mission: Mission = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      category: input.category,
      status: "OPEN",
      urgency: input.urgency || "NORMAL",
      budget: input.budget,
      locationId: input.locationId,
      coordinates: input.coordinates,
      radiusMeters: input.radiusMeters || 1500,
      requesterId,
      assignedScoutId: null,
      requiredTags: input.requiredTags || [],
      expiresAt: input.expiresAt,
      rewardPerValidSubmissionCents: input.rewardPerValidSubmissionCents,
      rewardBudgetCents: input.rewardBudgetCents || input.budget?.amountCents,
      remainingBudgetCents: input.rewardBudgetCents || input.budget?.amountCents,
      logVisibility: input.logVisibility || "PRIVATE",
      selectionMode: input.selectionMode || "AUTO",
      disputeMode: input.disputeMode || "DISABLED",
      maxParticipants: input.maxParticipants,
      screeningEnabled: input.screeningEnabled || false,
      screeningQuestions: input.screeningQuestions,
      quotas: input.quotas,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.missionRepo.create(mission);
    return mission;
  }
}
