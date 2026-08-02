const fs = require("fs");
const content = fs.readFileSync("apps/web/src/app/api/auth/sign-in/route.ts", "utf8");
const hasMock =
  content.includes("saveUser") || content.includes("DEBUG") || content.includes("user@test");
console.log(hasMock ? "Mock data found" : "No mock data found");
