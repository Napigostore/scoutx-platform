import type { IdentityRepository } from "@scoutx/infrastructure";

export class SignOutUseCase {
  constructor(private readonly identityRepo: IdentityRepository) {}

  async execute(refreshToken: string): Promise<void> {
    const session = await this.identityRepo.findSessionByToken(refreshToken);
    if (session) {
      await this.identityRepo.revokeSession(session.id);
    }
  }
}
