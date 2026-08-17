import { auth } from "@/lib/auth";
import { SimpleTokenVerifier, requireEnv } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";

const tokenVerifier = new SimpleTokenVerifier(requireEnv("JWT_SECRET"));
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);

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
export async function getAuthenticatedPrincipal(
  request: Request,
): Promise<AuthenticatedUserPrincipal | null> {
  // 1. NextAuth (Auth.js v5) session cookie check
  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = session.user as unknown as Record<string, unknown>;
      return {
        id: session.user.id,
        email: session.user.email ?? "",
        role: (user.role as string) ?? "REQUESTER",
        permissions: (user.permissions as string[]) ?? [],
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
    const principal = await getCurrentUserUseCase.execute(token);
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
