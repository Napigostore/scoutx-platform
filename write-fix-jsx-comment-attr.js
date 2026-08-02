const fs = require("fs");
let content = fs.readFileSync("apps/web/src/app/missions/[missionId]/page.tsx", "utf8");
content = content.replace(
  "{/* eslint-disable-next-line */}\n                        <img",
  "<img\n                          // eslint-disable-next-line @next/next/no-img-element",
);
fs.writeFileSync("apps/web/src/app/missions/[missionId]/page.tsx", content, "utf8");
console.log("Successfully fixed JSX comment placement");
