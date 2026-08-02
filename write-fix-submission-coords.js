const fs = require("fs");
let content = fs.readFileSync(
  "packages/application/src/use-cases/CreateMissionSubmissionUseCase.ts",
  "utf8",
);
content = content.replace(
  'if (isNaN(input.latitude) || isNaN(input.longitude)) {\n      throw new Error("Latitude and Longitude must be valid numbers");\n    }',
  'if (isNaN(input.latitude) || isNaN(input.longitude) || input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180) {\n      throw new Error("Latitude must be between -90 and 90, and Longitude must be between -180 and 180");\n    }',
);
fs.writeFileSync(
  "packages/application/src/use-cases/CreateMissionSubmissionUseCase.ts",
  content,
  "utf8",
);
console.log("Successfully added coordinate range validation");
