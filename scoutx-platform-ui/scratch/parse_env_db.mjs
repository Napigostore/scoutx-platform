import fs from "fs";

console.log("=== DATABASE_URL ENVIRONMENT AUDIT ===");

console.log("\n1. Current process.env.DATABASE_URL:");
const procUrl = process.env.DATABASE_URL;
if (procUrl) {
  try {
    const u = new URL(procUrl);
    console.log("   - Protocol:", u.protocol);
    console.log("   - Hostname:", u.hostname);
    console.log("   - Port:", u.port || "5432");
    console.log("   - Database:", u.pathname.replace(/^\//, ""));
    console.log("   - Is Neon Domain:", u.hostname.includes("neon.tech"));
  } catch (e) {
    console.log("   - Parse error:", e.message);
  }
} else {
  console.log("   - NOT SET in process.env");
}

console.log("\n2. apps/web/.env file:");
const webEnvPath = "C:/Users/ADMIN/scoutx-platform/apps/web/.env";
if (fs.existsSync(webEnvPath)) {
  const content = fs.readFileSync(webEnvPath, "utf8");
  for (const line of content.split("\n")) {
    if (line.trim().startsWith("DATABASE_URL")) {
      const fileUrl = line.substring(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
      try {
        const u = new URL(fileUrl);
        console.log("   - Protocol:", u.protocol);
        console.log("   - Hostname:", u.hostname);
        console.log("   - Port:", u.port || "5432");
        console.log("   - Database:", u.pathname.replace(/^\//, ""));
        console.log("   - Is Neon Domain:", u.hostname.includes("neon.tech"));
      } catch (e) {
        console.log("   - Parse error:", e.message);
      }
    }
  }
} else {
  console.log("   - apps/web/.env file not found");
}
