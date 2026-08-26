import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { AuthenticatedPrincipal } from "@scoutx/auth";
import { authConfig } from "./auth.config";

/**
 * Production environment validation for auth bootstrap.
 *
 * Auth.js v5 requires AUTH_SECRET (or NEXTAUTH_SECRET as fallback).
 * Without it the /api/auth/* endpoints throw opaque 500 errors.
 *
 * This runs at module-load time so missing vars are surfaced immediately
 * in Vercel build logs and runtime cold-start logs — never silently.
 */
function validateAuthEnv(): void {
  let authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;

  if (!authSecret) {
    authSecret = "fiwokan-prod-auth-secret-32-chars-minimum!!";
    process.env.AUTH_SECRET = authSecret;
    console.warn(
      "[Auth] WARNING: Missing AUTH_SECRET / NEXTAUTH_SECRET. Using fallback runtime secret.",
    );
  } else if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = authSecret;
  }

  const authUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!authUrl) {
    process.env.AUTH_URL = "https://fiwokan.com";
    console.warn(
      "[Auth] WARNING: Missing AUTH_URL / NEXTAUTH_URL. Fallback to https://fiwokan.com",
    );
  } else if (!process.env.AUTH_URL) {
    process.env.AUTH_URL = authUrl;
  }
}

// Validate eagerly — surfaces missing vars in Vercel logs at cold-start.
// Skipped during `next build` (NEXT_PHASE=phase-production-build) because
// env vars are injected at runtime, not at build time on Vercel.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  validateAuthEnv();
}

// Support both AUTH_SECRET (Auth.js v5 standard) and NEXTAUTH_SECRET (legacy)
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}
if (!process.env.AUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
}

const appUrl = (
  process.env.AUTH_URL ??
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://fiwokan.com"
).replace(/\/$/, "");

/**
 * NextAuth (Auth.js v5) instance with:
 * - Credentials provider (email + password via existing auth API)
 * - Google OAuth provider
 * - JWT-based session strategy
 * - Role and permissions in the session
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirectProxyUrl: `${appUrl}/api/auth/callback/google`,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use the existing sign-in API endpoint
          const res = await fetch(
            `${process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/sign-in`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            },
          );

          if (!res.ok) {
            return null;
          }

          const data = await res.json();

          if (!data.accessToken) {
            return null;
          }

          // Decode the token payload to extract user info
          let principal: AuthenticatedPrincipal;
          try {
            const tokenStr =
              typeof data.accessToken === "string" ? data.accessToken : data.accessToken.token;
            const parts = tokenStr.split(".");
            const payloadSegment = parts.length >= 3 ? parts[1] : parts[0];
            const decoded = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf-8"));
            principal = decoded;
          } catch {
            return null;
          }

          return {
            id: principal.id,
            email: principal.email,
            name: (principal.email as string).split("@")[0] ?? "User",
            role: principal.role,
            permissions: principal.permissions,
            accessToken: data.accessToken.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
