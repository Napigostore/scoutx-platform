// @ts-nocheck
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const p = path.resolve(__dirname, "../.env.production.local");
if (fs.existsSync(p)) {
  const envConfig = dotenv.parse(fs.readFileSync(p));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

import { PrismaClient } from "@prisma/client";
import { getMissionParticipantContext } from "./src/lib/server-auth";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function runTest() {
  const ts = Date.now();
  const requester = await prisma.user.create({ data: { email: `r_${ts}@t.com`, displayName: "R", role: "REQUESTER", passwordHash: "h" } });
  const worker = await prisma.user.create({ data: { email: `w_${ts}@t.com`, displayName: "W", role: "SCOUT", passwordHash: "h" } });
  const stranger = await prisma.user.create({ data: { email: `s_${ts}@t.com`, displayName: "S", role: "SCOUT", passwordHash: "h" } });
  const dummyLoc = await prisma.location.findFirst();

  const mission = await prisma.mission.create({
    data: {
      title: `Mission ${ts}`, category: "DELIVERY", budgetCents: 1000, latitude: 10, longitude: 10,
      locationId: dummyLoc.id, requesterId: requester.id, expiresAt: new Date(), status: "OPEN"
    }
  });

  await prisma.missionRecipient.create({ data: { missionId: mission.id, userId: worker.id } });

  // mock request
  const mockRequest = (userId, role) => ({
    headers: new Map([["authorization", ""]]),
    // mock getAuthenticatedPrincipal behavior by mocking prisma findUnique inside getMissionParticipantContext?
    // Actually, getMissionParticipantContext takes a Request. We can mock the token or just unit test the logic.
  });

  console.log("DB Test entities created.");
}
runTest().catch(console.error).finally(() => prisma.$disconnect());