const fs = require("fs");
let content = fs.readFileSync(
  "packages/infrastructure/src/repositories/PrismaIdentityRepository.ts",
  "utf8",
);
content = content.replace(
  'import { PrismaClient, UserRole as PrismaUserRole } from "@prisma/client";',
  'import { PrismaClient } from "@prisma/client";\nimport type { UserRole as PrismaUserRole } from "@prisma/client";',
);
fs.writeFileSync(
  "packages/infrastructure/src/repositories/PrismaIdentityRepository.ts",
  content,
  "utf8",
);
console.log("Successfully fixed PrismaIdentityRepository linting error");
