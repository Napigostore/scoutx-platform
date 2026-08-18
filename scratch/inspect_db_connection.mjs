import net from "net";
import { prisma } from "../apps/web/src/lib/prisma.js";

async function inspectDb() {
  console.log("=== PRODUCTION DATABASE CONNECTIVITY INVESTIGATION ===");
  
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.log("DATABASE_URL is missing in process.env!");
    return;
  }

  let host = "";
  let port = "5432";
  let dbName = "";
  let protocol = "";

  try {
    const u = new URL(rawUrl);
    protocol = u.protocol;
    host = u.hostname;
    port = u.port || "5432";
    dbName = u.pathname.replace(/^\//, "");

    console.log("1. Environment URL Analysis:");
    console.log("   - Provider / Protocol:", protocol.replace(":", ""));
    console.log("   - Target Hostname:", host);
    console.log("   - Port:", port);
    console.log("   - Database Name:", dbName);
    console.log("   - Query Parameters:", u.search);
  } catch (err) {
    console.log("Failed to parse process.env.DATABASE_URL:", err.message);
  }

  // Check if Host is literal dummy "HOST" or "postgres" or unresolved hostname
  if (host === "HOST" || host === "postgres" || host === "localhost" || host === "127.0.0.1") {
    console.log(`\n⚠️ CRITICAL FINDING: Hostname is literal/local '${host}'.`);
    if (host === "HOST") {
      console.log("   Explanation: The environment variable DATABASE_URL contains placeholder literal 'HOST' instead of the actual PostgreSQL domain/IP!");
    }
  }

  // Test TCP socket connection to host:port
  console.log(`\n2. Testing TCP Socket Connectivity to ${host}:${port}...`);
  const socket = new net.Socket();
  let socketConnected = false;

  const promise = new Promise((resolve) => {
    socket.setTimeout(5000);
    socket.on("connect", () => {
      socketConnected = true;
      console.log(`   ✅ TCP connection to ${host}:${port} SUCCEEDED.`);
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      console.log(`   ❌ TCP connection to ${host}:${port} TIMED OUT after 5000ms.`);
      socket.destroy();
      resolve(false);
    });

    socket.on("error", (err) => {
      console.log(`   ❌ TCP connection to ${host}:${port} FAILED: ${err.message}`);
      socket.destroy();
      resolve(false);
    });
  });

  socket.connect(Number(port), host);
  await promise;

  // Test Prisma SQL execution
  console.log("\n3. Testing Prisma Database Execution...");
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("   ✅ Prisma Query Succeeded:", res);
  } catch (err) {
    console.log("   ❌ Prisma Query Failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDb();
