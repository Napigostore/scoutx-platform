const fs = require("fs");
const content = `import type { Mission } from "@scoutx/types";
import type { MissionRepository } from "@scoutx/infrastructure";
import { AuthorizationError } from "@scoutx/auth";

export class GetAvailableMissionDetailsUseCase {
  constructor(private readonly missionRepo: MissionRepository) {}

  async execute(missionId: string, userRole: string): Promise<Mission> {
    if (userRole !== "SCOUT") {
      throw new AuthorizationError("Only scouts can view available mission details");
    }

    const mission = await this.missionRepo.findById(missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    if (mission.status !== "OPEN") {
      throw new Error("Mission is not available");
    }

    return mission;
  }
}
`;
fs.writeFileSync(
  "packages/application/src/use-cases/GetAvailableMissionDetailsUseCase.ts",
  content,
  "utf8",
);
console.log("Successfully wrote GetAvailableMissionDetailsUseCase.ts");
