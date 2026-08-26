// @ts-nocheck
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const pathsToTry = [
  path.resolve(__dirname, "../.env.production.local"),
  "C:/Users/HI/scoutx-platform/apps/web/.env.production.local",
  path.resolve(__dirname, "../.env.local"),
];

for (const p of pathsToTry) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    if (process.env.DATABASE_URL) break;
  }
}

import { PrismaClient } from "@prisma/client";
const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

import { getMissionParticipantContext } from "../src/lib/server-auth";
import { encode } from "next-auth/jwt";
import { POST as UploadEvidence } from "../src/app/api/evidence/upload/route";

async function mockRequest(userId: string | null, missionId: string) {
  const headers = new Headers();
  if (userId) {
    const user = await testPrisma.user.findUnique({ where: { id: userId } });
    const secret = process.env.AUTH_SECRET || "fiwokan-prod-auth-secret-32-chars-minimum!!";
    const token = await encode({
      token: { sub: user.id, email: user.email, role: user.role, id: user.id },
      secret,
      salt: "authjs.session-token", // or whatever next-auth v5 uses
    });
    // Just inject standard next-auth cookie
    headers.set("cookie", "authjs.session-token=" + token + ";");
  }
  
  const formData = new FormData();
  formData.append("missionId", missionId);
  formData.append("file", new File(["mock"], "test.png", { type: "image/png" }));
  
  return new Request("http://localhost/api/evidence/upload", {
    method: "POST",
    headers,
    body: formData
  });
}

async function main() {
  const timestamp = Date.now();
  const requester = await testPrisma.user.create({ data: { email: "req_$timestamp@t.com", authProviderId: "req_$timestamp", role: "USER" } });
  const worker = await testPrisma.user.create({ data: { email: "w_$timestamp@t.com", authProviderId: "w_$timestamp", role: "USER" } });
  const outsider = await testPrisma.user.create({ data: { email: "out_$timestamp@t.com", authProviderId: "out_$timestamp", role: "USER" } });
  
  const dummyLocation = await testPrisma.location.findFirst();
  const mission = await testPrisma.mission.create({
    data: {
      title: "Test Evidence Auth", description: "Test", category: "DELIVERY", budgetCents: 100000,
      latitude: 0, longitude: 0, locationId: dummyLocation.id, requesterId: requester.id,
      expiresAt: new Date(Date.now() + 86400000)
    }
  });

  // Test A: Requester
  console.log("Test A: Requester");
  const reqA = await mockRequest(requester.id, mission.id);
  const resA = await UploadEvidence(reqA);
  console.log("Requester Status:", resA.status);

  // Test B: Assigned Worker (Recipient)
  console.log("Test B: Assigned Worker (Recipient)");
  await testPrisma.missionRecipient.create({ data: { missionId: mission.id, userId: worker.id } });
  const reqB = await mockRequest(worker.id, mission.id);
  const resB = await UploadEvidence(reqB);
  console.log("Worker Status:", resB.status);

  // Test C: Outsider
  console.log("Test C: Outsider");
  const reqC = await mockRequest(outsider.id, mission.id);
  const resC = await UploadEvidence(reqC);
  console.log("Outsider Status:", resC.status);

  // Test D: Unauthenticated
  console.log("Test D: Unauthenticated");
  const reqD = await mockRequest(null, mission.id);
  const resD = await UploadEvidence(reqD);
  console.log("Unauth Status:", resD.status);
}

main().finally(() => testPrisma.$disconnect());
