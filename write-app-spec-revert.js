const fs = require("fs");
let content = fs.readFileSync("packages/application/test/application.spec.ts", "utf8");
content = content.replace('role: "REQUESTER"', 'role: "user"');
fs.writeFileSync("packages/application/test/application.spec.ts", content, "utf8");
console.log("Successfully updated packages/application/test/application.spec.ts");
