import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export interface CreateSubmissionInput {
  summary: string;
  mediaUrls: string[];
  latitude: number;
  longitude: number;
}

export class CreateMissionSubmissionUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(
    missionId: string,
    input: CreateSubmissionInput,
    scoutId: string,
    userRole: string,
  ): Promise<unknown> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can submit missions");
    }

    if (!input.summary || input.summary.trim().length < 10) {
      throw new Error("Summary must be at least 10 characters long");
    }

    if (
      isNaN(input.latitude) ||
      isNaN(input.longitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new Error(
        "Latitude must be between -90 and 90, and Longitude must be between -180 and 180",
      );
    }

    return this.missionRepo.createSubmissionAtomically(
      missionId,
      scoutId,
      input.summary,
      input.mediaUrls || [],
      input.latitude,
      input.longitude,
    );
  }
}
