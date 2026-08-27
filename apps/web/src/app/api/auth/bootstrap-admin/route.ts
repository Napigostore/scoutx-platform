import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SimplePasswordHasher } from "@scoutx/auth";

export async function POST() {
  try {
    const targetEmail = "truongtumoc@gmail.com";
    let user = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (user) {
      if (user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    } else {
      const passwordHasher = new SimplePasswordHasher();
      const passwordHash = await passwordHasher.hash("AdminSecurePassword2026!");

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
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to bootstrap admin";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
