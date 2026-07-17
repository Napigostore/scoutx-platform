import { describe, expect, it } from "vitest";
import {
  PrismaIdentityRepository,
} from "@scoutx/infrastructure";
import {
  SimplePasswordHasher,
  SimpleTokenVerifier,
  AuthorizationService,
  AuthenticationError,
} from "@scoutx/auth";
import {
  SignInUseCase,
  RefreshSessionUseCase,
  SignOutUseCase,
  GetCurrentUserUseCase,
  AuthorizeActionUseCase,
} from "../src/index.js";

describe("Application Layer Use Cases", () => {
  const identityRepo = new PrismaIdentityRepository();
  const passwordHasher = new SimplePasswordHasher();
  const tokenVerifier = new SimpleTokenVerifier("secret");
  const authorizationService = new AuthorizationService();

  const signInUseCase = new SignInUseCase(identityRepo, passwordHasher, tokenVerifier);
  const refreshSessionUseCase = new RefreshSessionUseCase(identityRepo, tokenVerifier);
  const signOutUseCase = new SignOutUseCase(identityRepo);
  const getCurrentUserUseCase = new GetCurrentUserUseCase(tokenVerifier);
  const authorizeActionUseCase = new AuthorizeActionUseCase(authorizationService);

  it("performs full authentication and authorization flow", async () => {
    // 1. Seed user
    await identityRepo.saveUser({
      id: "user-1",
      email: "user@test.com",
      passwordHash: "hashed:password123",
      role: "user",
    });

    // 2. Sign In
    const { accessToken, refreshToken } = await signInUseCase.execute("user@test.com", "password123");
    expect(accessToken.token).toBeDefined();
    expect(refreshToken).toBeDefined();

    // 3. Get Current User
    const principal = await getCurrentUserUseCase.execute(accessToken.token);
    expect(principal.email).toBe("user@test.com");

    // 4. Authorize Action
    expect(() =>
      authorizeActionUseCase.execute({ ...principal, permissions: ["profile:read"] }, "profile:read")
    ).not.toThrow();

    // 5. Refresh Session (Rotation)
    const refreshed = await refreshSessionUseCase.execute(refreshToken);
    expect(refreshed.accessToken.token).toBeDefined();
    expect(refreshed.newRefreshToken).not.toBe(refreshToken);

    // 6. Sign Out
    await signOutUseCase.execute(refreshed.newRefreshToken);
    await expect(refreshSessionUseCase.execute(refreshed.newRefreshToken)).rejects.toThrow(AuthenticationError);
  });
});
