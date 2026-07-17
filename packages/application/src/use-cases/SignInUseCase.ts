import type {
  PasswordHasher,
  TokenVerifier,
  Session,
  AccessToken,
  AuthenticatedPrincipal,
} from "@scoutx/auth";
import type { IdentityRepository } from "@scoutx/infrastructure";
import { AuthenticationError } from "@scoutx/auth";

export class SignInUseCase {
  constructor(
    private readonly identityRepo: IdentityRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenVerifier: TokenVerifier,
  ) {}

  async execute(
    email: string,
    password: string,
  ): Promise<{ accessToken: AccessToken; refreshToken: string }> {
    const user = await this.identityRepo.findUserByEmail(email);
    if (!user) {
      throw new AuthenticationError();
    }

    const isPasswordValid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError();
    }

    const principal: AuthenticatedPrincipal = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: [], // Will be loaded dynamically or mapped
    };

    const accessTokenString = await this.tokenVerifier.sign(principal, 900); // 15 mins
    const refreshToken = `refresh-${Math.random().toString(36).substring(2)}`;

    const session: Session = {
      id: `session-${Math.random().toString(36).substring(2)}`,
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
      revoked: false,
    };

    await this.identityRepo.saveSession(session);

    return {
      accessToken: {
        token: accessTokenString,
        expiresAt: new Date(Date.now() + 900 * 1000),
      },
      refreshToken,
    };
  }
}
