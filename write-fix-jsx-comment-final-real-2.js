const fs = require("fs");
let content = fs.readFileSync("apps/web/src/app/missions/[missionId]/page.tsx", "utf8");
content = content.replace(
  "{}\n                          <img",
  "{/* eslint-disable-next-line */}\n                          <img",
);
fs.writeFileSync("apps/web/src/app/missions/[missionId]/page.tsx", content, "utf8");
console.log("Successfully fixed JSX comment syntax");
