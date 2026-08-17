import { auth } from "@/lib/auth";
import { SimpleTokenVerifier } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";

function getLegacyCurrentUserUseCase() {
  const secret =
    process.env.JWT_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "fallback-jwt-secret-scoutx";
  const tokenVerifier = new SimpleTokenVerifier(secret);
  return new GetCurrentUserUseCase(tokenVerifier);
}

export interface AuthenticatedUserPrincipal {
  id: string;
  email: string;
  role: string;
  permissions: readonly string[];
}

/**
 * Universal API Route Authentication Helper.
 * 1. Checks NextAuth (Auth.js v5) session cookies first (for Google OAuth & Auth.js sessions).
 * 2. Falls back to legacy `Authorization: Bearer <token>` headers (for API token clients).
 */
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedPrincipal(
  request: Request,
): Promise<AuthenticatedUserPrincipal | null> {
  // 1. NextAuth (Auth.js v5) session cookie check
  try {
    const session = await auth();
    const sessionEmail = session?.user?.email ?? "";
    const sessionId = session?.user?.id ?? "";

    if (sessionId || sessionEmail) {
      const userObj = (session?.user as unknown as Record<string, unknown>) ?? {};
      const sessionRole = (userObj.role as string) ?? "REQUESTER";
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        sessionId,
      );

      let dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id: sessionId }] : []),
            ...(sessionEmail ? [{ email: sessionEmail }] : []),
          ],
        },
      });

      if (!dbUser && sessionEmail) {
        dbUser = await prisma.user.create({
          data: {
            email: sessionEmail,
            displayName: session?.user?.name ?? sessionEmail.split("@")[0] ?? "Requester",
            role: sessionRole === "SCOUT" ? "SCOUT" : "REQUESTER",
            passwordHash: "oauth-google-authenticated",
          },
        });
      }

      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          permissions: (userObj.permissions as string[]) ?? [],
        };
      }

      return {
        id: sessionId,
        email: sessionEmail,
        role: sessionRole,
        permissions: (userObj.permissions as string[]) ?? [],
      };
    }
  } catch {
    // NextAuth session check ignored on failure, fall back to Bearer token
  }

  // 2. Legacy Authorization: Bearer <token> header fallback
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  if (!token) return null;
  try {
    const principal = await getLegacyCurrentUserUseCase().execute(token);
    return {
      id: principal.id,
      email: principal.email,
      role: principal.role,
      permissions: principal.permissions,
    };
  } catch {
    return null;
  }
}
