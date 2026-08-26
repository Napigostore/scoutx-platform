// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function check() {
  const missions = await prisma.mission.findMany({ select: { id: true, visibility: true } });
  console.log("Visibilities:", missions.map(m => m.visibility).slice(0, 10));
}
check().finally(() => prisma.$disconnect());