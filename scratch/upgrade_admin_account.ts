import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envProd = path.resolve(__dirname, "../apps/web/.env.prod");
const envLocal = path.resolve(__dirname, "../apps/web/.env.local");
const envFile = path.resolve(__dirname, "../apps/web/.env");

if (fs.existsSync(envProd)) dotenv.config({ path: envProd, override: true });
else if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
else if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });

import { PrismaClient } from "@prisma/client";
import { SimplePasswordHasher } from "@scoutx/auth";

async function upgradeAdminAccount() {
  const prisma = new PrismaClient();
  const passwordHasher = new SimplePasswordHasher();

  console.log("=== CREATING / UPGRADING ADMIN ACCOUNT ===");
  console.log("DB URL set:", !!process.env.DATABASE_URL);
  const targetEmail = "truongtumoc@gmail.com";

  try {
    let user = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (user) {
      console.log(`Found existing user with ID: ${user.id}, current role: ${user.role}`);
      if (user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
        console.log(`✅ Updated user ${targetEmail} role to ADMIN`);
      } else {
        console.log(`✅ User ${targetEmail} is ALREADY an ADMIN`);
      }
    } else {
      console.log(`User ${targetEmail} does not exist. Creating new ADMIN user...`);
      const defaultPassword = "AdminSecurePassword2026!";
      const passwordHash = await passwordHasher.hash(defaultPassword);

      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: targetEmail,
          displayName: "Truong Tu Moc",
          role: "ADMIN",
          passwordHash,
          freeMissions: 9999,
        },
      });
      console.log(`✅ Successfully created ADMIN user: ID = ${user.id}, Email = ${user.email}`);
    }

    console.log("\n--- VERIFICATION RESULT ---");
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`DisplayName: ${user.displayName}`);
    console.log(`Role: ${user.role}`);
    console.log(`ADMIN_ACCOUNT: PASS`);
  } catch (err) {
    console.error("❌ Admin account setup error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeAdminAccount();
