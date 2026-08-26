import type { AuthenticatedPrincipal } from "../contracts/index.js";
import { createHmac, timingSafeEqual } from "crypto";

export interface TokenVerifier {
  sign(principal: AuthenticatedPrincipal, expiresInSeconds: number): Promise<string>;
  verify(token: string): Promise<AuthenticatedPrincipal>;
}

export class SimpleTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {
    if (!secret) {
      throw new Error("JWT secret is required for TokenVerifier");
    }
  }

  private computeSignature(payloadBase64: string): string {
    return createHmac("sha256", this.secret).update(payloadBase64).digest("hex");
  }

  async sign(principal: AuthenticatedPrincipal, expiresInSeconds: number): Promise<string> {
    const payload = {
      ...principal,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.computeSignature(payloadBase64);
    return `${payloadBase64}.${signature}`;
  }

  async verify(token: string): Promise<AuthenticatedPrincipal> {
    try {
      const parts = token.split(".");

      // Backward compatibility for legacy unsigned tokens or single-part tokens
      if (parts.length === 1 && parts[0]) {
        const decoded = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
        if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
          throw new Error("Token expired");
        }
        return {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions,
        };
      }

      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error("Invalid token format");
      }

      const payloadBase64 = parts[0];
      const signature = parts[1];
      const expectedSignature = this.computeSignature(payloadBase64);

      const sigBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        throw new Error("Invalid token signature");
      }

      const decoded = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8"));

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
