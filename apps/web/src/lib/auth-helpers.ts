import { SimpleTokenVerifier, type AuthenticatedPrincipal } from "@scoutx/auth";
import { GetCurrentUserUseCase } from "@scoutx/application";

const tokenVerifier = new SimpleTokenVerifier(process.env.JWT_SECRET || "default-secret");
const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);

export async function authenticate(request: Request): Promise<AuthenticatedPrincipal | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  if (!token) return null;
  try {
    return await getCurrentUserUseCase.execute(token);
  } catch {
    return null;
  }
}

export function requireRole(principal: AuthenticatedPrincipal, allowedRoles: string[]): boolean {
  return allowedRoles.includes(principal.role);
}
