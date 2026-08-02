const fs = require("fs");
const content = fs.readFileSync(
  "packages/infrastructure/src/repositories/PrismaIdentityRepository.ts",
  "utf8",
);
console.log(
  content.includes("prisma.session")
    ? "PrismaIdentityRepository uses real Prisma"
    : "PrismaIdentityRepository does NOT use real Prisma",
);
