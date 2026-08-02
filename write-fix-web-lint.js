const fs = require("fs");

// 1. Fix apps/web/src/app/missions/[missionId]/edit/page.tsx
let editPage = fs.readFileSync("apps/web/src/app/missions/[missionId]/edit/page.tsx", "utf8");
editPage = editPage.replace("} catch (err: any) {", "} catch (err: unknown) {");
editPage = editPage.replace(
  "setError(err.message);",
  "setError(err instanceof Error ? err.message : String(err));",
);
fs.writeFileSync("apps/web/src/app/missions/[missionId]/edit/page.tsx", editPage, "utf8");

// 2. Fix apps/web/src/app/missions/[missionId]/page.tsx
let detailsPage = fs.readFileSync("apps/web/src/app/missions/[missionId]/page.tsx", "utf8");
detailsPage = detailsPage.replace("} catch (err: any) {", "} catch (err: unknown) {");
detailsPage = detailsPage.replace(
  "alert(err.message);",
  "alert(err instanceof Error ? err.message : String(err));",
);
fs.writeFileSync("apps/web/src/app/missions/[missionId]/page.tsx", detailsPage, "utf8");

// 3. Fix apps/web/src/app/missions/new/page.tsx
let newPage = fs.readFileSync("apps/web/src/app/missions/new/page.tsx", "utf8");
newPage = newPage.replace(
  'const [locationId, setLocationId] = useState("00000000-0000-0000-0000-000000000001");',
  'const locationId = "00000000-0000-0000-0000-000000000001";',
);
newPage = newPage.replace("} catch (err: any) {", "} catch (err: unknown) {");
newPage = newPage.replace(
  "setError(err.message);",
  "setError(err instanceof Error ? err.message : String(err));",
);
fs.writeFileSync("apps/web/src/app/missions/new/page.tsx", newPage, "utf8");

console.log("Successfully fixed all web linting errors!");
