const fs = require("fs");

const files = [
  "apps/web/src/app/api/missions/[missionId]/publish/route.ts",
  "apps/web/src/app/api/scout/missions/[missionId]/assignment/route.ts",
  "apps/web/src/app/api/scout/missions/[missionId]/claim/route.ts",
  "apps/web/src/app/api/scout/missions/[missionId]/route.ts",
  "apps/web/src/app/api/scout/missions/[missionId]/start/route.ts",
  "apps/web/src/app/api/scout/missions/[missionId]/submission/route.ts",
  "apps/web/src/app/api/scout/missions/assigned/route.ts",
  "apps/web/src/app/api/scout/missions/route.ts",
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");

  // Remove prisma import if we don't need it anymore
  content = content.replace('import { prisma } from "@/lib/prisma";\n', "");

  // Replace database check with direct principal.role check
  content = content.replace(
    'const user = await prisma.user.findUnique({ where: { id: principal.id } });\n  if (!user || user.role !== "REQUESTER") {\n    return NextResponse.json({ error: "Forbidden" }, { status: 403 });\n  }',
    'if (principal.role !== "REQUESTER") {\n    return NextResponse.json({ error: "Forbidden" }, { status: 403 });\n  }',
  );

  content = content.replace(
    'const user = await prisma.user.findUnique({ where: { id: principal.id } });\n  if (!user || user.role !== "SCOUT") {\n    return NextResponse.json({ error: "Forbidden" }, { status: 403 });\n  }',
    'if (principal.role !== "SCOUT") {\n    return NextResponse.json({ error: "Forbidden" }, { status: 403 });\n  }',
  );

  fs.writeFileSync(file, content, "utf8");
  console.log("Successfully restored " + file);
}
