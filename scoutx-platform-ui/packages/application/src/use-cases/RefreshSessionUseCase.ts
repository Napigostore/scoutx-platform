import type { TokenVerifier, AccessToken, AuthenticatedPrincipal, Session } from "@scoutx/auth";
import type { IdentityRepository } from "@scoutx/infrastructure";
import { AuthenticationError } from "@scoutx/auth";

export class RefreshSessionUseCase {
  constructor(
    private readonly identityRepo: IdentityRepository,
    private readonly tokenVerifier: TokenVerifier,
  ) {}

  async execute(
    refreshToken: string,
  ): Promise<{ accessToken: AccessToken; newRefreshToken: string }> {
    const session = await this.identityRepo.findSessionByToken(refreshToken);
    if (!session || session.revoked || session.expiresAt.getTime() < Date.now()) {
      throw new AuthenticationError("Invalid or expired refresh token");
    }

    // Revoke old session (Refresh Token Rotation)
    await this.identityRepo.revokeSession(session.id);

    const user = await this.identityRepo.findUserById(session.userId);
    if (!user) {
      throw new AuthenticationError();
    }

    const principal: AuthenticatedPrincipal = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: [],
    };

    const accessTokenString = await this.tokenVerifier.sign(principal, 900);
    const newRefreshToken = `refresh-${Math.random().toString(36).substring(2)}`;

    const newSession: Session = {
      id: crypto.randomUUID(),
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revoked: false,
    };

    await this.identityRepo.saveSession(newSession);

    return {
      accessToken: {
        token: accessTokenString,
        expiresAt: new Date(Date.now() + 900 * 1000),
      },
      newRefreshToken,
    };
  }
}
