const fs = require("fs");
const content = `import type { Mission } from "@scoutx/types";

export interface MissionRepository {
  create(mission: Mission): Promise<void>;
  findById(id: string): Promise<Mission | null>;
  findByOwnerId(ownerId: string): Promise<readonly Mission[]>;
  update(mission: Mission): Promise<void>;
  findAvailable(): Promise<readonly Mission[]>;
  claimAtomically(missionId: string, scoutId: string): Promise<boolean>;
  findAssignedByScoutId(scoutId: string): Promise<readonly Mission[]>;
  createSubmissionAtomically(
    missionId: string,
    scoutId: string,
    summary: string,
    mediaUrls: string[],
    latitude: number,
    longitude: number,
  ): Promise<any>;
}
`;
fs.writeFileSync("packages/infrastructure/src/repositories/MissionRepository.ts", content, "utf8");
console.log("Successfully wrote MissionRepository.ts");
