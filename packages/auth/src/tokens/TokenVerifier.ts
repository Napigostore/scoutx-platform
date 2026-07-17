import type { AuthenticatedPrincipal } from "../contracts/index.js";

export interface TokenVerifier {
  sign(principal: AuthenticatedPrincipal, expiresInSeconds: number): Promise<string>;
  verify(token: string): Promise<AuthenticatedPrincipal>;
}

export class SimpleTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {}

  async sign(principal: AuthenticatedPrincipal, expiresInSeconds: number): Promise<string> {
    const payload = {
      ...principal,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  async verify(token: string): Promise<AuthenticatedPrincipal> {
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
        throw new Error("Token expired");
      }
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
      };
    } catch {
      throw new Error("Invalid or expired token");
    }
  }
}
