import { PrismaClient } from "@prisma/client";
import type { UserRole as PrismaUserRole } from "@prisma/client";
import type { UserIdentity, Session, Role } from "@scoutx/auth";

const globalForPrisma = globalThis as typeof globalThis & {
  __scoutxInfraPrisma?: PrismaClient;
};

const prisma =
  globalForPrisma.__scoutxInfraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__scoutxInfraPrisma = prisma;
}

function toContractRole(role: PrismaUserRole): Role {
  if (role === "ADMIN") return "ADMIN";
  if (role === "SCOUT") return "SCOUT";
  return "REQUESTER";
}

function toPrismaRole(role: Role): PrismaUserRole {
  if (role === "ADMIN") return "ADMIN";
  if (role === "SCOUT") return "SCOUT";
  return "REQUESTER";
}

export interface IdentityRepository {
  saveUser(user: UserIdentity): Promise<void>;
  findUserByEmail(email: string): Promise<UserIdentity | null>;
  findUserById(id: string): Promise<UserIdentity | null>;
  saveSession(session: Session): Promise<void>;
  findSessionByToken(token: string): Promise<Session | null>;
  revokeSession(id: string): Promise<void>;
}

export class PrismaIdentityRepository implements IdentityRepository {
  async saveUser(user: UserIdentity): Promise<void> {
    const fallbackDisplayName = user.email.split("@")[0] ?? user.email;
    const dbRole = toPrismaRole(user.role);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: user.passwordHash,
        role: dbRole,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: dbRole,
        displayName: fallbackDisplayName,
      },
    });

    if (dbRole === "SCOUT") {
      const existingProfile = await prisma.scoutProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        await prisma.scoutProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            displayName: fallbackDisplayName,
            bio: "Registered Scout on FIWOKAN platform",
            homeLocationId: "00000000-0000-0000-0000-000000000001",
            stripeConnectStatus: "ACTIVE",
          },
        });
      }
    }
  }

  async findUserByEmail(email: string): Promise<UserIdentity | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: toContractRole(row.role),
    };
  }

  async findUserById(id: string): Promise<UserIdentity | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: toContractRole(row.role),
    };
  }

  async saveSession(session: Session): Promise<void> {
    await prisma.session.upsert({
      where: { refreshToken: session.refreshToken },
      update: {
        expiresAt: session.expiresAt,
        revoked: session.revoked,
      },
      create: {
        id: session.id,
        userId: session.userId,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        revoked: session.revoked,
      },
    });
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const row = await prisma.session.findUnique({
      where: { refreshToken: token },
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      refreshToken: row.refreshToken,
      expiresAt: row.expiresAt,
      revoked: row.revoked,
    };
  }

  async revokeSession(id: string): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { revoked: true },
    });
  }
}
