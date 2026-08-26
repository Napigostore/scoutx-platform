import type { TokenVerifier, AuthenticatedPrincipal } from "@scoutx/auth";
import { AuthenticationError } from "@scoutx/auth";

export class GetCurrentUserUseCase {
  constructor(private readonly tokenVerifier: TokenVerifier) {}

  async execute(accessToken: string): Promise<AuthenticatedPrincipal> {
    try {
      return await this.tokenVerifier.verify(accessToken);
    } catch {
      throw new AuthenticationError("Invalid or expired access token");
    }
  }
}
