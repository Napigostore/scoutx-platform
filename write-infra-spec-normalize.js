const fs = require("fs");
let content = fs.readFileSync("packages/infrastructure/test/infrastructure.spec.ts", "utf8");
content = content.replace('role: "user" as const', 'role: "REQUESTER" as const');
fs.writeFileSync("packages/infrastructure/test/infrastructure.spec.ts", content, "utf8");
console.log("Successfully updated packages/infrastructure/test/infrastructure.spec.ts");
