import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SimplePasswordHasher } from "@scoutx/auth";

export async function POST(request: Request) {
  try {
    const targetEmail = "truongtumoc@gmail.com";
    const existingAdmin = await prisma.user.findFirst({
      where: { email: targetEmail, role: "ADMIN" },
    });

    // Lock endpoint if admin user already exists and has ADMIN role
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Bootstrap endpoint is locked. Admin account is already configured." },
        { status: 403 },
      );
    }

    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (secret) {
      const headerSecret = request.headers.get("x-bootstrap-secret");
      if (headerSecret !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let user = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    } else {
      const passwordHasher = new SimplePasswordHasher();
      const passwordHash = await passwordHasher.hash(
        process.env.ADMIN_INITIAL_PASSWORD || "AdminSecurePassword2026!",
      );

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
      message: "Admin account successfully bootstrapped.",
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

export async function GET(request: Request) {
  return POST(request);
}
