export type Role = "REQUESTER" | "SCOUT" | "ADMIN";

export type Permission =
  | "profile:read"
  | "profile:update:self"
  | "discovery:read"
  | "recommendation:read"
  | "mission:create"
  | "mission:update:self"
  | "moderation:review"
  | "administration:manage";

export interface AuthenticatedPrincipal {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly permissions: readonly Permission[];
}

export interface UserIdentity {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
}

export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly refreshToken: string;
  readonly expiresAt: Date;
  readonly revoked: boolean;
}

export interface AccessToken {
  readonly token: string;
  readonly expiresAt: Date;
}
