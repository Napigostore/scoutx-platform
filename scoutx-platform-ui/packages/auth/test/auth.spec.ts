import { describe, expect, it } from "vitest";
import {
  AuthorizationService,
  SimplePasswordHasher,
  SimpleTokenVerifier,
  getPermissionsForRole,
  AuthorizationError,
  type AuthenticatedPrincipal,
} from "../src/index.js";

describe("Auth Package Core Tests", () => {
  describe("RBAC & Permissions", () => {
    it("returns correct permissions for roles", () => {
      const requesterPerms = getPermissionsForRole("REQUESTER");
      expect(requesterPerms).toContain("profile:read");
      expect(requesterPerms).toContain("mission:create");
      expect(requesterPerms).not.toContain("administration:manage");

      const adminPerms = getPermissionsForRole("ADMIN");
      expect(adminPerms).toContain("administration:manage");
    });
  });

  describe("AuthorizationService", () => {
    const authService = new AuthorizationService();

    it("grants access when principal has permission", () => {
      const principal: AuthenticatedPrincipal = {
        id: "user-1",
        email: "user@test.com",
        role: "REQUESTER",
        permissions: ["profile:read"],
      };

      expect(() => authService.authorize({ principal }, "profile:read")).not.toThrow();
    });

    it("denies access when principal lacks permission", () => {
      const principal: AuthenticatedPrincipal = {
        id: "user-1",
        email: "user@test.com",
        role: "REQUESTER",
        permissions: ["profile:read"],
      };

      expect(() => authService.authorize({ principal }, "administration:manage")).toThrow(
        AuthorizationError,
      );
    });

    it("enforces ownership for self-scoped permissions", () => {
      const principal: AuthenticatedPrincipal = {
        id: "user-1",
        email: "user@test.com",
        role: "REQUESTER",
        permissions: ["profile:update:self"],
      };

      // Own resource -> Allowed
      expect(() =>
        authService.authorize({ principal, resourceOwnerId: "user-1" }, "profile:update:self"),
      ).not.toThrow();

      // Other resource -> Denied
      expect(() =>
        authService.authorize({ principal, resourceOwnerId: "user-2" }, "profile:update:self"),
      ).toThrow(AuthorizationError);

      // Admin can bypass ownership
      const adminPrincipal: AuthenticatedPrincipal = {
        id: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
        permissions: ["profile:update:self"],
      };
      expect(() =>
        authService.authorize(
          { principal: adminPrincipal, resourceOwnerId: "user-2" },
          "profile:update:self",
        ),
      ).not.toThrow();
    });
  });

  describe("PasswordHasher", () => {
    const hasher = new SimplePasswordHasher();

    it("hashes and compares passwords correctly", async () => {
      const hash = await hasher.hash("secret123");
      expect(hash).toBe("hashed:secret123");
      expect(await hasher.compare("secret123", hash)).toBe(true);
      expect(await hasher.compare("wrong", hash)).toBe(false);
    });
  });

  describe("TokenVerifier", () => {
    const verifier = new SimpleTokenVerifier("secret");

    it("signs and verifies tokens correctly", async () => {
      const principal: AuthenticatedPrincipal = {
        id: "user-1",
        email: "user@test.com",
        role: "REQUESTER",
        permissions: ["profile:read"],
      };

      const token = await verifier.sign(principal, 3600);
      const verified = await verifier.verify(token);
      expect(verified.id).toBe("user-1");
    });

    it("rejects expired tokens", async () => {
      const principal: AuthenticatedPrincipal = {
        id: "user-1",
        email: "user@test.com",
        role: "REQUESTER",
        permissions: ["profile:read"],
      };

      const token = await verifier.sign(principal, -10); // expired
      await expect(verifier.verify(token)).rejects.toThrow();
    });
  });
});
