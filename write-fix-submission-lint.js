const fs = require("fs");

// 1. Fix MissionRepository.ts
let repoInterface = fs.readFileSync(
  "packages/infrastructure/src/repositories/MissionRepository.ts",
  "utf8",
);
repoInterface = repoInterface.replace("Promise<any>;", "Promise<unknown>;");
fs.writeFileSync(
  "packages/infrastructure/src/repositories/MissionRepository.ts",
  repoInterface,
  "utf8",
);

// 2. Fix PrismaMissionRepository.ts
let repoImpl = fs.readFileSync(
  "packages/infrastructure/src/repositories/PrismaMissionRepository.ts",
  "utf8",
);
repoImpl = repoImpl.replace("Promise<any> {", "Promise<unknown> {");
fs.writeFileSync(
  "packages/infrastructure/src/repositories/PrismaMissionRepository.ts",
  repoImpl,
  "utf8",
);

// 3. Fix CreateMissionSubmissionUseCase.ts
let useCase = fs.readFileSync(
  "packages/application/src/use-cases/CreateMissionSubmissionUseCase.ts",
  "utf8",
);
useCase = useCase.replace('import type { Mission } from "@scoutx/types";\n', "");
useCase = useCase.replace("): Promise<any> {", "): Promise<unknown> {");
fs.writeFileSync(
  "packages/application/src/use-cases/CreateMissionSubmissionUseCase.ts",
  useCase,
  "utf8",
);

console.log("Successfully fixed all submission linting errors!");
