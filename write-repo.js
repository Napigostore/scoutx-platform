const fs = require("fs");
const content = `import { PrismaClient } from "@prisma/client";
import type { UserRole as PrismaUserRole } from "@prisma/client";
import type { UserIdentity, Session, Role } from "@scoutx/auth";

/**
 * Dedicated PrismaClient singleton for the @scoutx/infrastructure package.
 * Kept separate from apps/web/src/lib/prisma.ts because this package has no
 * access to the app's \`@/\` path alias. Both point at the same DATABASE_URL,
 * so this does not create a second database — only a second connection
 * pool. Consolidating into one shared client is a reasonable follow-up but
 * out of scope for this fix (see "Remaining issues").
 */
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

/**
 * Maps Prisma's \`UserRole\` enum (REQUESTER | SCOUT | ADMIN — the marketplace
 * roles) onto the auth layer's \`Role\` contract (user | moderator | admin |
 * service — the permission-tier roles). ScoutX currently has no concept of
 * "moderator" or "service" at the Prisma level, so those two contract roles
 * cannot be produced by this mapping today. This is a known modeling gap —
 * see "Remaining issues" in the SX-018A report.
 */
function toContractRole(role: PrismaUserRole): Role {
  if (role === "ADMIN") return "admin";
  return "user"; // REQUESTER and SCOUT both collapse to "user" for now
}

/**
 * Reverse mapping, needed only by \`saveUser\` when creating a brand-new
 * Prisma row. Lossy in the same way as \`toContractRole\`: "moderator" and
 * "service" have no Prisma equivalent and fall back to REQUESTER.
 */
function toPrismaRole(role: Role): PrismaUserRole {
  if (role === "admin") return "ADMIN";
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
    // NOTE: Prisma's \`User.displayName\` is a required column, but
    // \`UserIdentity\` (the auth-layer contract) has no \`displayName\` field.
    // This is a real interface/schema mismatch, not something invented
    // here — falling back to the email's local part so this method stays
    // usable. See "Remaining issues": either add \`displayName\` to
    // \`UserIdentity\`, or make the Prisma column optional with a default.
    const fallbackDisplayName = user.email.split("@")[0] ?? user.email;

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: user.passwordHash,
        role: toPrismaRole(user.role),
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: toPrismaRole(user.role),
        displayName: fallbackDisplayName,
      },
    });
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
    const row = await prisma.session.findUnique({ where: { refreshToken: token } });
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
`;
fs.writeFileSync(
  "packages/infrastructure/src/repositories/PrismaIdentityRepository.ts",
  content,
  "utf8",
);
console.log("Successfully wrote PrismaIdentityRepository.ts");
