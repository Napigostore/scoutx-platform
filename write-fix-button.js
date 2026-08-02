 , b vyyl  lkokkdkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk\tvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvconst fs = require("fs");
let content = fs.readFileSync("apps/web/src/app/missions/[missionId]/page.tsx", "utf8");
content = content.replace(
  'variant="destructive"',
  'variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"',
);
fs.writeFileSync("apps/web/src/app/missions/[missionId]/page.tsx", content, "utf8");
console.log("Successfully fixed Button variant in mission details page");
