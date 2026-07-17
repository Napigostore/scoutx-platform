import type { AuthorizationService, Permission, AuthenticatedPrincipal } from "@scoutx/auth";

export class AuthorizeActionUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  execute(principal: AuthenticatedPrincipal, permission: Permission, resourceOwnerId?: string): void {
    this.authorizationService.authorize({ principal, resourceOwnerId }, permission);
  }
}
