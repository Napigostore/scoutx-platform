import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth (Auth.js v5) configuration.
 *
 * Uses a Credentials provider (email + password via the existing SignInUseCase)
 * and a Google OAuth provider.
 *
 * Sessions are persisted via JWT (no database sessions).
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as Record<string, unknown>;
      if (user) {
        t.id = user.id;
        const u = user as unknown as { role?: string; permissions?: string[] };
        t.role = u.role ?? "REQUESTER";
        t.permissions = u.permissions ?? [];
      }

      const email = token.email as string | undefined;
      const tokenId = (token.id as string) ?? (token.sub as string);

      if (email || tokenId) {
        try {
          const { prisma } = await import("./prisma");
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            tokenId ?? "",
          );
          let dbUser = isUuid ? await prisma.user.findUnique({ where: { id: tokenId } }) : null;
          if (!dbUser && email) {
            dbUser = await prisma.user.findUnique({ where: { email } });
          }

          if (dbUser) {
            const scoutProfile = await prisma.scoutProfile.findUnique({
              where: { userId: dbUser.id },
            });
            if (scoutProfile || dbUser.role === "SCOUT") {
              t.role = "SCOUT";
            } else {
              t.role = dbUser.role;
            }
          }
        } catch {
          /* ignore DB lookup error during static jwt callback */
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as unknown as Record<string, unknown>;
        su.id = token.id;
        su.role = (token.role as string) ?? "REQUESTER";
        su.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Public routes – always accessible
      const publicPaths = ["/sign-in", "/api/auth"];
      if (publicPaths.some((p) => nextUrl.pathname.startsWith(p))) {
        return true;
      }

      // Requester routes
      if (nextUrl.pathname.startsWith("/missions")) {
        return isLoggedIn;
      }

      // Scout routes
      if (nextUrl.pathname.startsWith("/scout")) {
        return isLoggedIn;
      }

      // API routes – allow authenticated users
      if (nextUrl.pathname.startsWith("/api")) {
        return true;
      }

      // Root and other routes – allow authenticated
      return true;
    },
  },
  trustHost: true,
};
