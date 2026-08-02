import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { AuthenticatedPrincipal } from "@scoutx/auth";
import { authConfig } from "./auth.config";

/**
 * NextAuth (Auth.js v5) instance with:
 * - Credentials provider (email + password via existing auth API)
 * - Google OAuth provider
 * - JWT-based session strategy
 * - Role and permissions in the session
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
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
            `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/sign-in`,
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
            const decoded = JSON.parse(
              Buffer.from(data.accessToken.token, "base64").toString("utf-8"),
            );
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
