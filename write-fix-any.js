const fs = require("fs");
let content = fs.readFileSync(
  "packages/infrastructure/src/repositories/PrismaMissionRepository.ts",
  "utf8",
);
content = content.replace(
  'import type { Mission, MissionCategory, MissionUrgency } from "@scoutx/types";',
  'import type { Mission, MissionCategory, MissionUrgency, MissionStatus } from "@scoutx/types";',
);
content = content.replace(
  "status: toDomainStatus(row.status) as any,",
  "status: toDomainStatus(row.status) as MissionStatus,",
);
content = content.replace(
  "status: toDomainStatus(row.status) as any,",
  "status: toDomainStatus(row.status) as MissionStatus,",
);
fs.writeFileSync(
  "packages/infrastructure/src/repositories/PrismaMissionRepository.ts",
  content,
  "utf8",
);
console.log("Successfully fixed any cast in PrismaMissionRepository.ts");
