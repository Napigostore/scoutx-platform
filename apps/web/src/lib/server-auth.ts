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

  const cookieHeader = request.headers.get("cookie") || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0]?.trim())
    .filter((n): n is string => Boolean(n));

  console.log("[SERVER_AUTH_DEBUG] request_cookie_names:", cookieNames);

  // 1. NextAuth (Auth.js v5) session cookie check via auth()
  let authResultStatus = "none";
  try {
    const session = await auth();
    if (session?.user?.email || session?.user?.id) {
      sessionEmail = session.user.email ?? "";
      sessionId = session.user.id ?? "";
      const userObj = (session.user as unknown as Record<string, unknown>) ?? {};
      sessionRole = (userObj.role as string) ?? "REQUESTER";
      sessionPermissions = (userObj.permissions as string[]) ?? [];
      authResultStatus = "success";
    } else {
      authResultStatus = session ? "empty_user" : "null_session";
    }
  } catch (e) {
    authResultStatus = `error:${e instanceof Error ? e.message : "unknown"}`;
  }
  console.log("[SERVER_AUTH_DEBUG] auth_result:", authResultStatus);

  // 2. Request-aware getToken() fallback for NextAuth session cookies in serverless API routes
  let getTokenStatus = "skipped";
  if (!sessionEmail && !sessionId) {
    try {
      const secret =
        process.env.AUTH_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        process.env.JWT_SECRET ??
        "fiwokan-prod-auth-secret-32-chars-minimum!!";

      const cookies: Record<string, string> = {};
      cookieHeader.split(";").forEach((c) => {
        const parts = c.trim().split("=");
        const name = parts[0]?.trim();
        if (name && parts.length >= 2) {
          cookies[name] = parts.slice(1).join("=");
        }
      });

      const reqObj = {
        headers: Object.fromEntries(request.headers.entries()),
        cookies,
      } as unknown as Parameters<typeof getToken>[0]["req"];

      // Attempt 1: Standard getToken with request object directly
      let token = await getToken({
        req: request as unknown as Parameters<typeof getToken>[0]["req"],
        secret,
        secureCookie: process.env.NODE_ENV === "production",
      });

      // Attempt 2: Standard getToken with reqObj
      if (!token) {
        token = await getToken({
          req: reqObj,
          secret,
          secureCookie: process.env.NODE_ENV === "production",
        });
      }

      // Attempt 2: Explicit Auth.js v5 secure cookie name fallback
      if (!token) {
        token = await getToken({
          req: reqObj,
          secret,
          cookieName: "__Secure-authjs.session-token",
        });
      }

      // Attempt 3: Explicit Auth.js v5 non-secure cookie name fallback
      if (!token) {
        token = await getToken({
          req: reqObj,
          secret,
          cookieName: "authjs.session-token",
        });
      }

      // Attempt 4: Explicit NextAuth legacy secure cookie name fallback
      if (!token) {
        token = await getToken({
          req: reqObj,
          secret,
          cookieName: "__Secure-next-auth.session-token",
        });
      }

      // Attempt 5: Explicit NextAuth legacy non-secure cookie name fallback
      if (!token) {
        token = await getToken({
          req: reqObj,
          secret,
          cookieName: "next-auth.session-token",
        });
      }

      if (token?.email || token?.sub || token?.id) {
        sessionEmail = (token.email as string) ?? "";
        sessionId = (token.id as string) ?? (token.sub as string) ?? "";
        sessionRole = (token.role as string) ?? "REQUESTER";
        sessionPermissions = (token.permissions as string[]) ?? [];
        getTokenStatus = "success";
      } else {
        getTokenStatus = token ? "token_no_id" : "null_token";
      }
    } catch (e) {
      getTokenStatus = `error:${e instanceof Error ? e.message : "unknown"}`;
    }
    console.log("[SERVER_AUTH_DEBUG] getToken_result:", getTokenStatus);
  }

  console.log("[SERVER_AUTH_DEBUG] resolved_session_email:", sessionEmail || "none");

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

    if (dbUser && dbUser.email === "truongtumoc@gmail.com" && dbUser.role !== "ADMIN") {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: "ADMIN" },
      });
    }

    if (!dbUser && sessionEmail) {
      const isAdminEmail = sessionEmail === "truongtumoc@gmail.com";
      dbUser = await prisma.user.create({
        data: {
          email: sessionEmail,
          displayName: sessionEmail.split("@")[0] ?? "Requester",
          role: isAdminEmail ? "ADMIN" : sessionRole === "SCOUT" ? "SCOUT" : "REQUESTER",
          passwordHash: "oauth-google-authenticated",
        },
      });
    }

    if (dbUser) {
      console.log("[SERVER_AUTH_DEBUG] resolved_db_user_uuid:", dbUser.id);
      return {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        permissions: sessionPermissions,
      };
    }

    if (isUuid) {
      console.log("[SERVER_AUTH_DEBUG] resolved_db_user_uuid:", sessionId);
      return {
        id: sessionId,
        email: sessionEmail,
        role: sessionRole,
        permissions: sessionPermissions,
      };
    }
  }

  console.log("[SERVER_AUTH_DEBUG] resolved_db_user_uuid: none");

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

export async function getAuthenticatedScoutContext(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    principal.id,
  );

  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
  if (!user && principal.email) {
    user = await prisma.user.findUnique({ where: { email: principal.email } });
  }

  const userId = user ? user.id : principal.id;
  let scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId },
  });

  if (!scoutProfile && user) {
    scoutProfile = await prisma.scoutProfile.findFirst({
      where: { userId: user.id },
    });
  }

  const userRole = user ? user.role : principal.role;
  const isScout = Boolean(scoutProfile || userRole === "SCOUT");

  if (!isScout) {
    return { error: "Forbidden", status: 403 as const };
  }

  return {
    principal,
    user,
    userId,
    scoutProfile,
    effectiveRole: "SCOUT" as const,
  };
}

export async function getMissionParticipantContext(request: Request, missionId: string) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    principal.id,
  );

  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
  if (!user && principal.email) {
    user = await prisma.user.findUnique({ where: { email: principal.email } });
  }

  const userId = user ? user.id : principal.id;
  const userRole = user ? user.role : principal.role;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      requesterId: true,
      assignedScoutId: true,
      recipients: {
        where: { userId },
      },
      submission: true,
      visibility: true,
    },
  });

  if (!mission) {
    return { error: "Mission not found", status: 404 as const };
  }

  let scoutProfile = await prisma.scoutProfile.findUnique({
    where: { userId },
  });

  if (!scoutProfile && user) {
    scoutProfile = await prisma.scoutProfile.findFirst({
      where: { userId: user.id },
    });
  }

  const isRequester = mission.requesterId === userId;
  const isAssignedScout = Boolean(scoutProfile && mission.assignedScoutId === scoutProfile.id);
  const isRecipient = mission.recipients && mission.recipients.length > 0;
  const isSubmitter = Boolean(mission.submission && mission.submission.userId === userId);
  const isAdmin = userRole === "ADMIN";
  const isPublicParticipant = mission.visibility === "PUBLIC";

  const hasEvidence = await prisma.evidence
    .findFirst({
      where: { missionId, userId },
      select: { id: true },
    })
    .then((res) => Boolean(res));

  if (
    !isRequester &&
    !isAssignedScout &&
    !isRecipient &&
    !isSubmitter &&
    !hasEvidence &&
    !isPublicParticipant &&
    !isAdmin
  ) {
    return {
      error: "Forbidden: You are not an authorized participant for this mission",
      status: 403 as const,
    };
  }

  const participantRole: "REQUESTER" | "SCOUT" | "ADMIN" = isAdmin
    ? "ADMIN"
    : isRequester
      ? "REQUESTER"
      : "SCOUT";

  return {
    principal,
    user,
    userId,
    userRole,
    scoutProfile,
    mission,
    participantRole,
    isRequester,
    isAssignedScout,
    isAdmin,
  };
}
