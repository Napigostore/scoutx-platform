import type { AuthenticatedPrincipal, Permission } from "../contracts/index";
import { AuthorizationError } from "../errors/index";

export interface AuthorizationContext {
  readonly principal: AuthenticatedPrincipal;
  readonly resourceOwnerId?: string;
}

export class AuthorizationService {
  authorize(context: AuthorizationContext, requiredPermission: Permission): void {
    // Deny by default
    if (!context.principal) {
      throw new AuthorizationError("No authenticated principal found");
    }

    const hasPermission = context.principal.permissions.includes(requiredPermission);
    if (!hasPermission) {
      throw new AuthorizationError(`Missing required permission: ${requiredPermission}`);
    }

    // Ownership check for self-mutating permissions
    if (requiredPermission.endsWith(":self")) {
      if (!context.resourceOwnerId) {
        throw new AuthorizationError("Resource owner ID is required for self-scoped actions");
      }
      if (context.principal.id !== context.resourceOwnerId && context.principal.role !== "ADMIN") {
        throw new AuthorizationError("You do not own this resource");
      }
    }
  }
}
