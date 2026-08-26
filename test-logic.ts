// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { getMissionParticipantContext } from "./apps/web/src/lib/server-auth";

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function testAuth() {
  const missionId = "some-mission-id";
  // We can just manually simulate the logic of getMissionParticipantContext
  // to see if there is any logical flaw.
  console.log("Testing logic...");
}
testAuth();