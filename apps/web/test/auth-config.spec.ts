import { describe, expect, it } from "vitest";
import { authConfig } from "../src/lib/auth.config";

describe("Auth Config", () => {
  it("should have sign-in page configured", () => {
    expect(authConfig.pages?.signIn).toBe("/sign-in");
  });

  it("should have JWT session strategy", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
  });

  it("should set max session age to 7 days", () => {
    expect(authConfig.session?.maxAge).toBe(7 * 24 * 60 * 60);
  });

  it("should trust host", () => {
    expect(authConfig.trustHost).toBe(true);
  });

  describe("callbacks", () => {
    describe("jwt", () => {
      it("should enrich token with user role and permissions on sign-in", async () => {
        const token = {} as Record<string, unknown>;
        const user = { id: "user-1", role: "SCOUT", permissions: ["profile:read"] } as never;
        const result = await authConfig.callbacks!.jwt!({
          token, user, account: null, profile: undefined as never, trigger: "signIn" as never, session: undefined as never,
        });
        expect((result as { id?: string }).id).toBe("user-1");
        expect((result as { role?: string }).role).toBe("SCOUT");
        expect((result as { permissions?: string[] }).permissions).toEqual(["profile:read"]);
      });

      it("should preserve existing token if no user is provided", async () => {
        const token = { id: "user-1", role: "REQUESTER", permissions: [] } as never;
        const result = await authConfig.callbacks!.jwt!({
          token, user: undefined as never, account: null, profile: undefined as never, trigger: "update" as never, session: undefined as never,
        });
        expect((result as { role?: string }).role).toBe("REQUESTER");
      });
    });

    describe("session", () => {
      it("should expose id, role, and permissions from token", async () => {
        const token = { id: "user-1", role: "ADMIN", permissions: ["administration:manage"] } as never;
        const session = { user: { email: "admin@example.com" } } as never;
        const result = await authConfig.callbacks!.session!(
          { session, token, newSession: undefined, trigger: "update" } as never
        );
        expect(result.user!.id).toBe("user-1");
        expect((result.user as { role?: string }).role).toBe("ADMIN");
        expect((result.user as { permissions?: readonly string[] }).permissions).toEqual(["administration:manage"]);
      });
    });

    describe("authorized", () => {
      const fn = authConfig.callbacks!.authorized!;
      const cases = [
        { n: "allow sign-in for everyone", a: null, u: "http://x/sign-in", e: true },
        { n: "allow api/auth for everyone", a: null, u: "http://x/api/auth/session", e: true },
        { n: "deny /missions for unauthenticated", a: null, u: "http://x/missions", e: false },
        { n: "allow /missions for REQUESTER", a: { user: { role: "REQUESTER" } }, u: "http://x/missions", e: true },
        { n: "deny /missions for SCOUT", a: { user: { role: "SCOUT" } }, u: "http://x/missions", e: false },
        { n: "allow /missions for ADMIN", a: { user: { role: "ADMIN" } }, u: "http://x/missions", e: true },
        { n: "deny /scout for unauthenticated", a: null, u: "http://x/scout", e: false },
        { n: "allow /scout for SCOUT", a: { user: { role: "SCOUT" } }, u: "http://x/scout", e: true },
        { n: "deny /scout for REQUESTER", a: { user: { role: "REQUESTER" } }, u: "http://x/scout", e: false },
        { n: "allow /scout for ADMIN", a: { user: { role: "ADMIN" } }, u: "http://x/scout", e: true },
        { n: "allow /api for authenticated", a: { user: { role: "REQUESTER" } }, u: "http://x/api/missions", e: true },
        { n: "allow root for everyone", a: null, u: "http://x/", e: true },
      ];
      cases.forEach(({ n, a, u, e }) => {
        it(n, async () => {
          expect(await fn({ auth: a as never, request: { nextUrl: new URL(u) } as never })).toBe(e);
        });
      });
    });
  });
});



