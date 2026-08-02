const fs = require("fs");
const content = `{
  "name": "@scoutx/application",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@scoutx/domain": "workspace:*",
    "@scoutx/auth": "workspace:*",
    "@scoutx/infrastructure": "workspace:*",
    "@scoutx/types": "workspace:*"
  },
  "devDependencies": {
    "@scoutx/typescript-config": "workspace:*",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
`;
fs.writeFileSync("packages/application/package.json", content, "utf8");
console.log("Successfully wrote packages/application/package.json");
