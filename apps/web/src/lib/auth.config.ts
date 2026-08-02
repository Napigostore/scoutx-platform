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
      if (user) {
        const t = token as Record<string, unknown>;
        t.id = user.id;
        const u = user as unknown as { role: string; permissions: string[] };
        t.role = u.role;
        t.permissions = u.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as unknown as Record<string, unknown>;
        su.id = token.id;
        su.role = token.role;
        su.permissions = token.permissions;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      // Public routes – always accessible
      const publicPaths = ["/sign-in", "/api/auth"];
      if (publicPaths.some((p) => nextUrl.pathname.startsWith(p))) {
        return true;
      }

      // Requester routes
      if (nextUrl.pathname.startsWith("/missions")) {
        if (!isLoggedIn) return false;
        if (role === "REQUESTER" || role === "ADMIN") return true;
        return false; // Scouts cannot access requester routes
      }

      // Scout routes
      if (nextUrl.pathname.startsWith("/scout")) {
        if (!isLoggedIn) return false;
        if (role === "SCOUT" || role === "ADMIN") return true;
        return false; // Requesters cannot access scout routes
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
