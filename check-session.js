const fs = require("fs");
const content = fs.readFileSync("apps/web/prisma/schema.prisma", "utf8");
console.log(
  content.includes("model Session") ? "Session model confirmed" : "Session model NOT found",
);
