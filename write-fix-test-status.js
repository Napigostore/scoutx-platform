const fs = require("fs");
let content = fs.readFileSync("packages/application/test/mission.spec.ts", "utf8");
content = content.replace(
  'expect(published.status).toBe("OPEN");',
  'expect(published.status).toBe("PUBLISHED");',
);
fs.writeFileSync("packages/application/test/mission.spec.ts", content, "utf8");
console.log("Successfully updated packages/application/test/mission.spec.ts");
