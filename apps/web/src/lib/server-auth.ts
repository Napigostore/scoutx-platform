import { auth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { SimpleTokenVerifier } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";
import { prisma } from "@/lib/prisma";

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

export async function getAuthenticatedPrincipal(
  request: Request,
): Promise<AuthenticatedUserPrincipal | null> {
  let sessionEmail = "";
  let sessionId = "";
  let sessionRole = "REQUESTER";
  let sessionPermissions: string[] = [];

  // 1. NextAuth (Auth.js v5) session cookie check via auth()
  try {
    const session = await auth();
    if (session?.user?.email || session?.user?.id) {
      sessionEmail = session.user.email ?? "";
      sessionId = session.user.id ?? "";
      const userObj = (session.user as unknown as Record<string, unknown>) ?? {};
      sessionRole = (userObj.role as string) ?? "REQUESTER";
      sessionPermissions = (userObj.permissions as string[]) ?? [];
    }
  } catch {
    // Session lookup via auth() ignored on failure
  }

  // 2. Request-aware getToken() fallback for NextAuth session cookies in serverless API routes
  if (!sessionEmail && !sessionId) {
    try {
      const secret =
        process.env.AUTH_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        process.env.JWT_SECRET ??
        "fiwokan-prod-auth-secret-32-chars-minimum!!";

      const cookieHeader = request.headers.get("cookie") || "";
      const cookies: Record<string, string> = {};
      cookieHeader.split(";").forEach((c) => {
        const parts = c.trim().split("=");
        const name = parts[0]?.trim();
        if (name && parts.length >= 2) {
          cookies[name] = parts.slice(1).join("=");
        }
      });

      const token = await getToken({
        req: {
          headers: Object.fromEntries(request.headers.entries()),
          cookies,
        } as unknown as Parameters<typeof getToken>[0]["req"],
        secret,
        secureCookie: process.env.NODE_ENV === "production",
      });

      if (token?.email || token?.sub || token?.id) {
        sessionEmail = (token.email as string) ?? "";
        sessionId = (token.id as string) ?? (token.sub as string) ?? "";
        sessionRole = (token.role as string) ?? "REQUESTER";
        sessionPermissions = (token.permissions as string[]) ?? [];
      }
    } catch {
      // getToken check ignored on failure
    }
  }

  // 3. Database User lookup & auto-provisioning via verified session identity
  if (sessionEmail || sessionId) {
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
          displayName: sessionEmail.split("@")[0] ?? "Requester",
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
        permissions: sessionPermissions,
      };
    }

    if (isUuid) {
      return {
        id: sessionId,
        email: sessionEmail,
        role: sessionRole,
        permissions: sessionPermissions,
      };
    }
  }

  // 4. Legacy Authorization: Bearer <token> header fallback
  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  if (!bearerToken) return null;
  try {
    const principal = await getLegacyCurrentUserUseCase().execute(bearerToken);
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
